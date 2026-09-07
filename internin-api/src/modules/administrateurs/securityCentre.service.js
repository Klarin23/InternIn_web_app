/**
 * Centre de sécurité — agrégation lecture + révocation de sessions.
 * Sources : sessions_utilisateur, utilisateurs, administrateurs, journal_actions_admin.
 * Pas de données fictives. Pas de second système d'auth.
 */
import {
  eq,
  and,
  desc,
  gte,
  lt,
  count,
  sql,
  inArray,
  or,
  ilike,
  gt,
  countDistinct,
} from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  sessionsUtilisateur,
  utilisateurs,
  administrateurs,
  journalActionsAdmin,
  tentativesConnexion,
} from "../../db/schema.js";
import { logAdminAction } from "./auditAdmin.service.js";
import { incrementerVersionJeton } from "../../utils/versionJeton.js";
import { notifierAdmins } from "../notifications/notifications.service.js";
import { notifications } from "../../db/schema.js";
import {
  scoreRegulariteIntervalles,
  computeBehavioralScores,
} from "./securityScoring.js";
import {
  syncSecurityAlertsFromComptes,
  getSecurityAlertsStats,
} from "./securityAlerts.service.js";

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function maskIp(ip) {
  if (!ip) return null;
  const s = String(ip);
  if (s.includes(".")) {
    const parts = s.split(".");
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.xxx.xxx`;
  }
  if (s.length > 8) return s.slice(0, 4) + "…";
  return "xxx";
}

const SENSITIVE_ACTION_PATTERNS = [
  "%parametre%",
  "%export%",
  "%suspend%",
  "%anomalie%",
  "%permission%",
  "%session%",
  "%CONVENTION_%",
  "%SECURITY%",
  "%revok%",
  "%approuv%",
  "%statut%",
];

/**
 * Vue d'ensemble sécurité (KPI + état global + priorités).
 */

/**
 * Alerte les admins (notification in-app) si l'état sécurité n'est plus "securisee".
 * Déduplication : pas plus d'une alerte du même niveau dans les 6 dernières heures.
 */
async function maybeAlertAdminsSecurityEtat(etat, etatLabel, etatMessage) {
  if (!etat || etat === "securisee") return;

  try {
    const since = new Date(Date.now() - 6 * 3600 * 1000);
    const type = "security_etat";
    const titrePrefix = `[Sécurité] État ${etatLabel}`;

    const recents = await db
      .select({
        id: notifications.idNotification,
        titre: notifications.titre,
      })
      .from(notifications)
      .where(
        and(
          eq(notifications.type, type),
          gte(notifications.dateCreation, since),
        ),
      )
      .limit(100);

    if (recents.some((n) => String(n.titre || "").startsWith(titrePrefix))) {
      return;
    }

    await notifierAdmins({
      type,
      titre: `${titrePrefix}`,
      message:
        etatMessage ||
        `Un état de sécurité « ${etatLabel} » a été détecté. Ouvrez le centre de sécurité.`,
      lien: "/centre-securite",
    });
  } catch (err) {
    // Ne jamais faire échouer l'overview pour une alerte
    console.error("[security] maybeAlertAdminsSecurityEtat:", err?.message || err);
  }
}

export async function getSecurityOverview() {
  const now = new Date();
  const today = startOfDay(now);
  const week = new Date(now.getTime() - 7 * 86400000);

  const [
    [{ total: utilisateursActifs }],
    [{ total: comptesSuspendus }],
    [{ total: sessionsActives }],
    [{ total: adminsCount }],
    [{ total: actionsSensiblesAuj }],
    [{ total: actionsSensiblesSem }],
    [{ total: auditAuj }],
    recentSensitive,
    suspendedSample,
  ] = await Promise.all([
    db
      .select({ total: count() })
      .from(utilisateurs)
      .where(eq(utilisateurs.statutCompte, "actif")),
    db
      .select({ total: count() })
      .from(utilisateurs)
      .where(eq(utilisateurs.statutCompte, "suspendu")),
    db
      .select({ total: count() })
      .from(sessionsUtilisateur)
      .where(gte(sessionsUtilisateur.dateExpiration, now)),
    db.select({ total: count() }).from(administrateurs),
    db
      .select({ total: count() })
      .from(journalActionsAdmin)
      .where(
        and(
          gte(journalActionsAdmin.dateCreation, today),
          or(
            ...SENSITIVE_ACTION_PATTERNS.map((p) =>
              ilike(journalActionsAdmin.action, p),
            ),
          ),
        ),
      ),
    db
      .select({ total: count() })
      .from(journalActionsAdmin)
      .where(
        and(
          gte(journalActionsAdmin.dateCreation, week),
          or(
            ...SENSITIVE_ACTION_PATTERNS.map((p) =>
              ilike(journalActionsAdmin.action, p),
            ),
          ),
        ),
      ),
    db
      .select({ total: count() })
      .from(journalActionsAdmin)
      .where(gte(journalActionsAdmin.dateCreation, today)),
    db
      .select({
        idJournal: journalActionsAdmin.idJournal,
        action: journalActionsAdmin.action,
        typeEntite: journalActionsAdmin.typeEntite,
        motif: journalActionsAdmin.motif,
        dateCreation: journalActionsAdmin.dateCreation,
        idAdministrateur: journalActionsAdmin.idAdministrateur,
        email: utilisateurs.email,
      })
      .from(journalActionsAdmin)
      .leftJoin(
        utilisateurs,
        eq(journalActionsAdmin.idAdministrateur, utilisateurs.idUtilisateur),
      )
      .where(
        and(
          gte(journalActionsAdmin.dateCreation, week),
          or(
            ...SENSITIVE_ACTION_PATTERNS.map((p) =>
              ilike(journalActionsAdmin.action, p),
            ),
          ),
        ),
      )
      .orderBy(desc(journalActionsAdmin.dateCreation))
      .limit(8),
    db
      .select({
        idUtilisateur: utilisateurs.idUtilisateur,
        email: utilisateurs.email,
        typeUtilisateur: utilisateurs.typeUtilisateur,
        statutCompte: utilisateurs.statutCompte,
      })
      .from(utilisateurs)
      .where(eq(utilisateurs.statutCompte, "suspendu"))
      .limit(5),
  ]);

  const nSuspendus = Number(comptesSuspendus || 0);
  const nSensiblesAuj = Number(actionsSensiblesAuj || 0);

  // Activité suspecte (détection live)
  let suspectStats = {
    normal: 0,
    inhabituels: 0,
    suspects: 0,
    partage: 0,
    automatisation: 0,
    attaque: 0,
    critiques: 0,
    comptesSuspects: 0,
    importants: 0,
    echecsLogin1h: 0,
    top: [],
    analyzedAccounts: 0,
    nonAnalyzedAccounts: 0,
    scoreGlobalMax: 0,
    status: "ok",
  };
  try {
    const stats = await getSecurityOverviewStats();
    suspectStats = {
      ...suspectStats,
      ...stats,
      // compat logique etat (anciens consommateurs)
      importants:
        Number(stats.suspects || 0) +
        Number(stats.partage || 0) +
        Number(stats.automatisation || 0),
      status: "ok",
    };
  } catch (err) {
    // Ne pas masquer l'échec derrière des zéros trompeurs
    console.error("[securityCentre] getSecurityOverviewStats failed:", err?.message || err);
    suspectStats = {
      ...suspectStats,
      status: "unavailable",
      error: "stats_unavailable",
    };
  }

  let etat = "securisee";
  let etatLabel = "Sécurisée";
  let etatMessage =
    "Aucune situation critique détectée à partir des données disponibles.";

  if (
    nSuspendus > 10 ||
    nSensiblesAuj > 30 ||
    suspectStats.importants > 0 ||
    suspectStats.comptesSuspects > 0
  ) {
    etat = "attention";
    etatLabel = "Attention";
    etatMessage = `${suspectStats.comptesSuspects} compte(s) suspect(s) · ${nSuspendus} suspendu(s) · ${nSensiblesAuj} action(s) sensible(s) aujourd'hui.`;
  }
  if (nSuspendus > 50 || suspectStats.critiques > 0 || suspectStats.echecsLogin1h >= 20) {
    etat = "critique";
    etatLabel = "Critique";
    etatMessage =
      suspectStats.critiques > 0
        ? `${suspectStats.critiques} compte(s) à score critique — intervention recommandée.`
        : "Volume élevé de risques — vérification recommandée.";
  }

  const priorites = [];
  for (const c of suspectStats.top || []) {
    priorites.push({
      niveau: c.niveau === "critique" ? "critique" : "important",
      titre: `Activité suspecte (score ${c.score})`,
      description: c.motif || c.email,
      type: "suspect",
      id: c.idUtilisateur,
      typeUtilisateur: c.typeUtilisateur,
      email: c.email,
    });
  }
  for (const s of suspendedSample) {
    if (priorites.length >= 5) break;
    priorites.push({
      niveau: "important",
      titre: "Compte suspendu",
      description: s.email,
      type: "compte",
      id: s.idUtilisateur,
      typeUtilisateur: s.typeUtilisateur,
    });
  }
  for (const e of recentSensitive.slice(0, 3)) {
    if (priorites.length >= 5) break;
    priorites.push({
      niveau: "attention",
      titre: e.action,
      description: e.motif || e.typeEntite,
      type: "audit",
      id: e.idJournal,
      email: e.email,
      date: e.dateCreation,
    });
  }

  // Notification admin (critique / attention) — non bloquant
  await maybeAlertAdminsSecurityEtat(etat, etatLabel, etatMessage);

  const activiteSuspecte = {
    normal: Number(suspectStats.normal || 0),
    inhabituels: Number(suspectStats.inhabituels || 0),
    suspects: Number(suspectStats.suspects || 0),
    partage: Number(suspectStats.partage || 0),
    automatisation: Number(suspectStats.automatisation || 0),
    attaque: Number(suspectStats.attaque || 0),
    critiques: Number(suspectStats.critiques || 0),
    comptesSuspects: Number(suspectStats.comptesSuspects || 0),
    importants: Number(suspectStats.importants || 0),
    echecsLogin1h: Number(suspectStats.echecsLogin1h || 0),
    scoreGlobalMax: Number(suspectStats.scoreGlobalMax || 0),
    analyzedAccounts: Number(suspectStats.analyzedAccounts || 0),
    nonAnalyzedAccounts: Number(suspectStats.nonAnalyzedAccounts || 0),
    top: Array.isArray(suspectStats.top) ? suspectStats.top : [],
    repartition: suspectStats.repartition || null,
    status: suspectStats.status || "ok",
  };

  let alertesSecuriteStats = {
    critiques: 0,
    aExaminer: 0,
    enCours: 0,
    resolues: 0,
    totalOuvertes: 0,
    parGravite: { critique: 0, important: 0, attention: 0, information: 0 },
  };
  try {
    alertesSecuriteStats = await getSecurityAlertsStats();
  } catch {
    /* table absente ou erreur — non bloquant */
  }

  return {
    etat,
    etatLabel,
    etatMessage,
    analyseAt: now.toISOString(),
    // Compat frontend (lecture top-level)
    utilisateursActifs: Number(utilisateursActifs || 0),
    activiteSuspecte,
    alertes: alertesSecuriteStats,
    // Alias historique éventuel
    suspectStats: activiteSuspecte,
    kpi: {
      utilisateursActifs: Number(utilisateursActifs || 0),
      sessionsActives: Number(sessionsActives || 0),
      comptesSuspendus: nSuspendus,
      administrateurs: Number(adminsCount || 0),
      evenementsAuditAuj: Number(auditAuj || 0),
      actionsSensiblesAuj: nSensiblesAuj,
      actionsSensiblesSemaine: Number(actionsSensiblesSem || 0),
      comptesSuspects: activiteSuspecte.comptesSuspects,
      comptesSuspectsCritiques: activiteSuspecte.critiques,
      echecsLogin1h: activiteSuspecte.echecsLogin1h,
      normal: activiteSuspecte.normal,
      inhabituels: activiteSuspecte.inhabituels,
      suspects: activiteSuspecte.suspects,
      partage: activiteSuspecte.partage,
      automatisation: activiteSuspecte.automatisation,
      attaque: activiteSuspecte.attaque,
    },
    priorites: priorites.slice(0, 5),
    limitations: [],
  };
}

/**
 * Sessions encore valides (non expirées).
 */
export async function listActiveSessions({ page = 1, limit = 50 } = {}) {
  const now = new Date();
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 50));
  const offset = (pageNum - 1) * limitNum;

  const [rows, countRows] = await Promise.all([
    db
      .select({
        idSession: sessionsUtilisateur.idSession,
        idUtilisateur: sessionsUtilisateur.idUtilisateur,
        adresseIp: sessionsUtilisateur.adresseIp,
        paysConnexion: sessionsUtilisateur.paysConnexion,
        villeConnexion: sessionsUtilisateur.villeConnexion,
        dateCreation: sessionsUtilisateur.dateCreation,
        dateExpiration: sessionsUtilisateur.dateExpiration,
        email: utilisateurs.email,
        typeUtilisateur: utilisateurs.typeUtilisateur,
        statutCompte: utilisateurs.statutCompte,
      })
      .from(sessionsUtilisateur)
      .innerJoin(
        utilisateurs,
        eq(sessionsUtilisateur.idUtilisateur, utilisateurs.idUtilisateur),
      )
      .where(gte(sessionsUtilisateur.dateExpiration, now))
      .orderBy(desc(sessionsUtilisateur.dateCreation))
      .limit(limitNum)
      .offset(offset),
    db
      .select({ total: count() })
      .from(sessionsUtilisateur)
      .where(gte(sessionsUtilisateur.dateExpiration, now)),
  ]);

  return {
    sessions: rows.map((r) => ({
      idSession: r.idSession,
      idUtilisateur: r.idUtilisateur,
      email: r.email,
      typeUtilisateur: r.typeUtilisateur,
      statutCompte: r.statutCompte,
      adresseIp: r.adresseIp || null,
      adresseIpMasquee: maskIp(r.adresseIp),
      paysConnexion: r.paysConnexion || null,
      villeConnexion: r.villeConnexion || null,
      dateCreation: r.dateCreation,
      dateExpiration: r.dateExpiration,
    })),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: Number(countRows[0]?.total || 0),
      totalPages: Math.max(
        1,
        Math.ceil(Number(countRows[0]?.total || 0) / limitNum),
      ),
    },
  };
}

/**
 * Révoque une session (suppression serveur) + audit.
 */
export async function revokeSessionById(idSession, idAdministrateur) {
  const [session] = await db
    .select()
    .from(sessionsUtilisateur)
    .where(eq(sessionsUtilisateur.idSession, idSession))
    .limit(1);

  if (!session) {
    const err = new Error("Session introuvable ou déjà révoquée");
    err.status = 404;
    throw err;
  }

  await db
    .delete(sessionsUtilisateur)
    .where(eq(sessionsUtilisateur.idSession, idSession));

  // Invalide immédiatement les access JWT de cet utilisateur
  await incrementerVersionJeton(session.idUtilisateur);

  await logAdminAction({
    idAdministrateur,
    typeEntite: "session",
    idEntite: idSession,
    action: "SECURITY_SESSION_REVOKED",
    motif: `Révocation session utilisateur ${session.idUtilisateur}`,
    ancienStatut: "active",
    nouveauStatut: "revoquee",
  });

  return { ok: true, idSession, idUtilisateur: session.idUtilisateur };
}

/**
 * Révoque toutes les sessions d'un utilisateur.
 */
export async function revokeAllSessionsForUser(idUtilisateur, idAdministrateur) {
  const result = await db
    .delete(sessionsUtilisateur)
    .where(eq(sessionsUtilisateur.idUtilisateur, idUtilisateur))
    .returning({ idSession: sessionsUtilisateur.idSession });

  await incrementerVersionJeton(idUtilisateur);

  await logAdminAction({
    idAdministrateur,
    typeEntite: "utilisateur",
    idEntite: idUtilisateur,
    action: "SECURITY_ALL_SESSIONS_REVOKED",
    motif: `${result.length} session(s) révoquée(s) + JWT invalidés`,
  });

  return { ok: true, count: result.length };
}

/**
 * Liste des administrateurs (rôles réels).
 */
export async function listSecurityAdmins() {
  const rows = await db
    .select({
      idAdmin: administrateurs.idAdmin,
      idUtilisateur: administrateurs.idUtilisateur,
      nom: administrateurs.nom,
      roleAdmin: administrateurs.roleAdmin,
      email: utilisateurs.email,
      statutCompte: utilisateurs.statutCompte,
    })
    .from(administrateurs)
    .innerJoin(
      utilisateurs,
      eq(administrateurs.idUtilisateur, utilisateurs.idUtilisateur),
    )
    .orderBy(administrateurs.nom);

  // Actions audit récentes par admin (7j)
  const week = new Date(Date.now() - 7 * 86400000);
  const counts = await db
    .select({
      idAdministrateur: journalActionsAdmin.idAdministrateur,
      n: count(),
    })
    .from(journalActionsAdmin)
    .where(gte(journalActionsAdmin.dateCreation, week))
    .groupBy(journalActionsAdmin.idAdministrateur);

  const map = Object.fromEntries(
    counts.map((c) => [c.idAdministrateur, Number(c.n)]),
  );

  return rows.map((r) => ({
    ...r,
    actions7j: map[r.idUtilisateur] || 0,
  }));
}

/**
 * Seuils de détection d'activité suspecte (ajustables).
 */
export const SUSPICIOUS_THRESHOLDS = {
  multiSessionsActives: Number(process.env.SEC_MULTI_SESSIONS || 3),
  multiIp7j: Number(process.env.SEC_MULTI_IP_7J || 3),
  sessionsRapides24h: Number(process.env.SEC_SESSIONS_24H || 5),
  echecsLogin1h: Number(process.env.SEC_ECHECS_1H || 5),
  echecsLogin24h: Number(process.env.SEC_ECHECS_24H || 10),
  scoreAttention: 30,
  scoreCritique: 60,
  /** Automatisation : tentatives sur fenêtre courte */
  autoTentativesFenetreMin: Number(process.env.SEC_AUTO_TENTATIVES || 15),
  autoFenetreMs: Number(process.env.SEC_AUTO_FENETRE_MS || 6 * 60 * 1000),
  /** Régularité des intervalles (coefficient de variation bas = bot) */
  autoRegulariteCvMax: 0.15,
};

const MS_H = 3_600_000;
const MS_D = 86_400_000;

/**
 * Détection d'activité suspecte par compte — données réelles uniquement.
 * Signaux :
 *  - multi_sessions : plusieurs sessions actives simultanées
 *  - multi_ip : plusieurs IP distinctes (7 jours)
 *  - sessions_rapides : beaucoup de sessions créées en 24h
 *  - echecs_login : tentatives de connexion échouées (1h / 24h)
 *  - compte_suspendu : compte déjà suspendu
 *  - email_non_verifie : email non vérifié avec session active
 */

export async function listComptesARisque({ limit = 30 } = {}) {
  const now = new Date();
  const h1 = new Date(now.getTime() - MS_H);
  const d1 = new Date(now.getTime() - MS_D);
  const d7 = new Date(now.getTime() - 7 * MS_D);
  const T = SUSPICIOUS_THRESHOLDS;
  const limitNum = Math.min(50, Math.max(1, Number(limit) || 30));

  // Sessions non expirées
  const sessionsActives = await db
    .select({
      idUtilisateur: sessionsUtilisateur.idUtilisateur,
      adresseIp: sessionsUtilisateur.adresseIp,
      paysConnexion: sessionsUtilisateur.paysConnexion,
      villeConnexion: sessionsUtilisateur.villeConnexion,
      dateCreation: sessionsUtilisateur.dateCreation,
    })
    .from(sessionsUtilisateur)
    .where(gte(sessionsUtilisateur.dateExpiration, now));

  // Sessions 7 jours (IP + géo + horaires)
  const sessions7j = await db
    .select({
      idUtilisateur: sessionsUtilisateur.idUtilisateur,
      adresseIp: sessionsUtilisateur.adresseIp,
      paysConnexion: sessionsUtilisateur.paysConnexion,
      villeConnexion: sessionsUtilisateur.villeConnexion,
      dateCreation: sessionsUtilisateur.dateCreation,
    })
    .from(sessionsUtilisateur)
    .where(gte(sessionsUtilisateur.dateCreation, d7));

  // Tentatives échouées 24h
  let tentatives = [];
  try {
    tentatives = await db
      .select({
        email: tentativesConnexion.email,
        idUtilisateur: tentativesConnexion.idUtilisateur,
        adresseIp: tentativesConnexion.adresseIp,
        motif: tentativesConnexion.motif,
        dateCreation: tentativesConnexion.dateCreation,
      })
      .from(tentativesConnexion)
      .where(gte(tentativesConnexion.dateCreation, d1));
  } catch {
    tentatives = []; // table absente tant que migration non appliquée
  }

  // Agrégats par utilisateur
  const byUser = new Map();

  function ensure(id, email = null) {
    if (!id) return null;
    if (!byUser.has(id)) {
      byUser.set(id, {
        idUtilisateur: id,
        email: email || null,
        sessionsActives: 0,
        ipsActives: new Set(),
        ips7j: new Set(),
        lieux: new Set(),
        connexions: [],
        sessions24h: 0,
        echecs1h: 0,
        echecs24h: 0,
        echecsTimestamps: [],
        echecsFenetreCourte: 0,
        regulariteScore: 0,
      });
    }
    return byUser.get(id);
  }

  for (const s of sessionsActives) {
    const u = ensure(s.idUtilisateur);
    if (!u) continue;
    u.sessionsActives += 1;
    if (s.adresseIp) u.ipsActives.add(s.adresseIp);
    if (s.dateCreation && new Date(s.dateCreation) >= d1) u.sessions24h += 1;
  }

  for (const s of sessions7j) {
    const u = ensure(s.idUtilisateur);
    if (!u) continue;
    if (s.adresseIp) u.ips7j.add(s.adresseIp);
    const lieu = [s.villeConnexion, s.paysConnexion].filter(Boolean).join(", ");
    if (lieu) u.lieux.add(lieu);
    u.connexions.push({
      adresseIp: s.adresseIp || null,
      paysConnexion: s.paysConnexion || null,
      villeConnexion: s.villeConnexion || null,
      pays: s.paysConnexion || null,
      ville: s.villeConnexion || null,
      dateConnexion: s.dateCreation,
    });
  }

  /** IP → comptes distincts (sessions réussies 7j) */
  const successUsersByIp = new Map();
  /** IP → timestamps de sessions (pour cadence) */
  const sessionTimesByIp = new Map();
  for (const s of sessions7j) {
    if (!s.adresseIp || !s.idUtilisateur) continue;
    const ip = String(s.adresseIp);
    if (!successUsersByIp.has(ip)) successUsersByIp.set(ip, new Set());
    successUsersByIp.get(ip).add(s.idUtilisateur);
    if (!sessionTimesByIp.has(ip)) sessionTimesByIp.set(ip, []);
    if (s.dateCreation) {
      sessionTimesByIp.get(ip).push(new Date(s.dateCreation).getTime());
    }
  }

  // Recount sessions created in 24h (all sessions, not only active)
  const sessions24hRows = await db
    .select({
      idUtilisateur: sessionsUtilisateur.idUtilisateur,
      n: count(),
    })
    .from(sessionsUtilisateur)
    .where(gte(sessionsUtilisateur.dateCreation, d1))
    .groupBy(sessionsUtilisateur.idUtilisateur);

  for (const r of sessions24hRows) {
    const u = ensure(r.idUtilisateur);
    if (u) u.sessions24h = Number(r.n || 0);
  }

  // Map email → id for tentatives without idUtilisateur
  const emailsNeeded = [
    ...new Set(
      tentatives.filter((t) => !t.idUtilisateur && t.email).map((t) => t.email),
    ),
  ];
  const emailToId = {};
  if (emailsNeeded.length) {
    const users = await db
      .select({
        idUtilisateur: utilisateurs.idUtilisateur,
        email: utilisateurs.email,
      })
      .from(utilisateurs)
      .where(inArray(utilisateurs.email, emailsNeeded));
    for (const u of users) emailToId[u.email] = u.idUtilisateur;
  }

  /** @type {Map<string, Set<string>>} IP → set user ids */
  const usersByIp = new Map();
  /** @type {Map<string, Array<{at:number, ip:string|null, email:string|null}>>} */
  const echecsDetailByUser = new Map();

  for (const t of tentatives) {
    const id = t.idUtilisateur || emailToId[t.email];
    const ip = t.adresseIp ? String(t.adresseIp) : null;
    if (ip) {
      if (!usersByIp.has(ip)) usersByIp.set(ip, new Set());
      if (id) usersByIp.get(ip).add(id);
      else if (t.email) usersByIp.get(ip).add(`email:${t.email}`);
    }
    if (!id) continue;
    const u = ensure(id, t.email);
    if (!u) continue;
    u.echecs24h += 1;
    if (t.dateCreation && new Date(t.dateCreation) >= h1) u.echecs1h += 1;
    if (t.dateCreation) {
      u.echecsTimestamps.push(new Date(t.dateCreation).getTime());
    }
    if (!echecsDetailByUser.has(id)) echecsDetailByUser.set(id, []);
    echecsDetailByUser.get(id).push({
      at: t.dateCreation ? new Date(t.dateCreation).getTime() : Date.now(),
      ip,
      email: t.email || null,
    });
    if (t.email && !u.email) u.email = t.email;
  }

  /** IP → nombre d'échecs (pré-agrégé, O(n) une fois) */
  const failAttemptsByIp = new Map();
  for (const dets of echecsDetailByUser.values()) {
    for (const d of dets) {
      if (!d.ip) continue;
      failAttemptsByIp.set(d.ip, (failAttemptsByIp.get(d.ip) || 0) + 1);
    }
  }

  // Fenêtre courte + régularité par compte
  for (const u of byUser.values()) {
    const ts = (u.echecsTimestamps || []).sort((a, b) => a - b);
    u.regulariteScore = scoreRegulariteIntervalles(ts);
    const fen = T.autoFenetreMs;
    let maxWin = 0;
    let j = 0;
    for (let i = 0; i < ts.length; i++) {
      while (ts[i] - ts[j] > fen) j += 1;
      maxWin = Math.max(maxWin, i - j + 1);
    }
    u.echecsFenetreCourte = maxWin;

    // Fusion sessions réussies + échecs par IP
    let maxMulti = 0;
    let bestIpCtx = {
      multiAccountsSameIp: 0,
      successfulAccountsByIp: 0,
      failedAccountsByIp: 0,
      failedAttemptsByIp: 0,
      rapidSessionsByIp: 0,
    };

    const candidateIps = new Set([
      ...(u.ips7j || []),
      ...(u.ipsActives || []),
    ]);
    for (const det of echecsDetailByUser.get(u.idUtilisateur) || []) {
      if (det.ip) candidateIps.add(det.ip);
    }

    for (const ip of candidateIps) {
      const failSet = usersByIp.get(ip) || new Set();
      const okSet = successUsersByIp.get(ip) || new Set();
      const merged = new Set([...failSet, ...okSet]);
      const n = merged.size;
      if (n > maxMulti) {
        maxMulti = n;
        const times = (sessionTimesByIp.get(ip) || []).slice().sort((a, b) => a - b);
        let rapid = 0;
        let j = 0;
        const win = 15 * 60 * 1000;
        for (let i = 0; i < times.length; i++) {
          while (times[i] - times[j] > win) j += 1;
          rapid = Math.max(rapid, i - j + 1);
        }
        bestIpCtx = {
          multiAccountsSameIp: n,
          successfulAccountsByIp: okSet.size,
          failedAccountsByIp: failSet.size,
          failedAttemptsByIp: failAttemptsByIp.get(ip) || 0,
          rapidSessionsByIp: rapid,
        };
      }
    }
    u.multiAccountsSameIp = maxMulti;
    u.ipContext = bestIpCtx;
  }

  // Comptes suspendus (toujours inclus)
  const suspendus = await db
    .select({
      idUtilisateur: utilisateurs.idUtilisateur,
      email: utilisateurs.email,
      typeUtilisateur: utilisateurs.typeUtilisateur,
      statutCompte: utilisateurs.statutCompte,
      emailVerifie: utilisateurs.emailVerifie,
      derniereConnexion: utilisateurs.derniereConnexion,
    })
    .from(utilisateurs)
    .where(eq(utilisateurs.statutCompte, "suspendu"));

  for (const s of suspendus) {
    const u = ensure(s.idUtilisateur, s.email);
    if (u) {
      u._suspendu = true;
      u.email = s.email;
      u.typeUtilisateur = s.typeUtilisateur;
      u.statutCompte = s.statutCompte;
      u.emailVerifie = s.emailVerifie;
      u.derniereConnexion = s.derniereConnexion;
    }
  }

  // Charger profils pour tous les ids détectés
  const ids = [...byUser.keys()];
  if (!ids.length) return [];

  const profils = await db
    .select({
      idUtilisateur: utilisateurs.idUtilisateur,
      email: utilisateurs.email,
      typeUtilisateur: utilisateurs.typeUtilisateur,
      statutCompte: utilisateurs.statutCompte,
      emailVerifie: utilisateurs.emailVerifie,
      derniereConnexion: utilisateurs.derniereConnexion,
    })
    .from(utilisateurs)
    .where(inArray(utilisateurs.idUtilisateur, ids));

  const profilMap = Object.fromEntries(profils.map((p) => [p.idUtilisateur, p]));

  const results = [];

  for (const [id, agg] of byUser) {
    const profil = profilMap[id];
    if (!profil) continue;
    // Ignorer les admins pour multi-session "normale" ? Non — on signale tout compte

    const behavioral = computeBehavioralScores(agg, profil, T, {
      multiAccountsSameIp: agg.ipContext?.multiAccountsSameIp || agg.multiAccountsSameIp || 0,
      successfulAccountsByIp: agg.ipContext?.successfulAccountsByIp || 0,
      failedAccountsByIp: agg.ipContext?.failedAccountsByIp || 0,
      failedAttemptsByIp: agg.ipContext?.failedAttemptsByIp || 0,
      rapidSessionsByIp: agg.ipContext?.rapidSessionsByIp || 0,
    });
    if (behavioral.signaux.length === 0 || behavioral.scoreGlobal < 15) continue;

    const nIp = agg.ips7j.size || agg.ipsActives.size;
    const ipsListe = [...(agg.ips7j.size ? agg.ips7j : agg.ipsActives)];
    const connexions = [...(agg.connexions || [])]
      .sort(
        (a, b) =>
          new Date(b.dateConnexion || 0).getTime() -
          new Date(a.dateConnexion || 0).getTime(),
      )
      .slice(0, 8);

    // Timeline pour investigation (connexions + échecs récents)
    const timeline = [];
    for (const c of connexions) {
      timeline.push({
        type: "connexion",
        at: c.dateConnexion,
        ip: c.adresseIp || null,
        lieu: [c.villeConnexion, c.paysConnexion].filter(Boolean).join(", ") || null,
      });
    }
    const echecsDet = (echecsDetailByUser.get(id) || [])
      .slice()
      .sort((a, b) => b.at - a.at)
      .slice(0, 5);
    for (const e of echecsDet) {
      timeline.push({
        type: "login_failure",
        timestamp: new Date(e.at).toISOString(),
        at: new Date(e.at).toISOString(),
        ip: e.ip,
        location: null,
        lieu: null,
        success: false,
      });
    }
    // normalise connexions
    for (const ev of timeline) {
      if (ev.type === "connexion") {
        ev.type = "login_success";
        ev.timestamp = ev.at;
        ev.location = ev.lieu;
        ev.success = true;
      }
    }
    timeline.sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));

    results.push({
      idUtilisateur: id,
      email: profil.email,
      typeUtilisateur: profil.typeUtilisateur,
      statutCompte: profil.statutCompte,
      emailVerifie: profil.emailVerifie,
      derniereConnexion: profil.derniereConnexion,
      score: behavioral.scoreGlobal,
      scoreGlobal: behavioral.scoreGlobal,
      scorePartageCompte: behavioral.scorePartageCompte,
      scoreAutomatisation: behavioral.scoreAutomatisation,
      niveau: behavioral.niveau,
      niveauLegacy: behavioral.niveauLegacy,
      confiance: behavioral.confiance,
      scoreAuthentification: behavioral.scoreAuthentification,
      signaux: behavioral.signaux,
      sessionsActives: agg.sessionsActives,
      ipsDistinctes7j: nIp,
      zones: [...(agg.lieux || [])].length,
      ips: ipsListe,
      lieux: [...(agg.lieux || [])],
      connexions,
      timeline: timeline.slice(0, 12),
      echecsLogin24h: agg.echecs24h,
      echecsLogin1h: agg.echecs1h,
      echecsFenetreCourte: agg.echecsFenetreCourte || 0,
      regularitePct: Math.round((agg.regulariteScore || 0) * 100),
      motif: behavioral.signaux.map((s) => s.label).join(" · "),
      whyScore: behavioral.signaux.map((s) => ({
        code: s.code,
        label: s.label,
        points: s.points || 0,
        axe: s.axe,
        meta: s.meta || null,
      })),
      ipStats: agg.ipContext || null,
    });
  }

  results.sort((a, b) => b.score - a.score || a.email.localeCompare(b.email));
  const limited = results.slice(0, limitNum);
  try {
    await syncSecurityAlertsFromComptes(limited);
  } catch {
    /* non bloquant */
  }
  return limited;
}

/**
 * KPI sécurité globaux, indépendants de la pagination des comptes à risque.
 *
 * Le calcul est effectué par lots de profils et agrège les événements
 * nécessaires à chaque lot. Aucun LIMIT de la liste d'investigation ne peut
 * donc tronquer les KPI. Le moteur computeBehavioralScores reste inchangé.
 */
async function computeSecurityOverviewStatsUncached() {
  const BATCH_SIZE = 500;
  const now = new Date();
  const h1 = new Date(now.getTime() - MS_H);
  const d1 = new Date(now.getTime() - MS_D);
  const d7 = new Date(now.getTime() - 7 * MS_D);
  const T = SUSPICIOUS_THRESHOLDS;

  const totals = {
    normal: 0,
    inhabituel: 0,
    suspect: 0,
    partage_probable: 0,
    automatisation_probable: 0,
    attaque_probable: 0,
    critique: 0,
    analyzedAccounts: 0,
    nonAnalyzedAccounts: 0,
    top: [],
  };

  let cursor = null;

  while (true) {
    const userWhere = cursor
      ? gt(utilisateurs.idUtilisateur, cursor)
      : undefined;

    const profils = await db
      .select({
        idUtilisateur: utilisateurs.idUtilisateur,
        email: utilisateurs.email,
        typeUtilisateur: utilisateurs.typeUtilisateur,
        statutCompte: utilisateurs.statutCompte,
        emailVerifie: utilisateurs.emailVerifie,
        derniereConnexion: utilisateurs.derniereConnexion,
      })
      .from(utilisateurs)
      .where(userWhere)
      .orderBy(utilisateurs.idUtilisateur)
      .limit(BATCH_SIZE);

    if (!profils.length) break;
    cursor = profils[profils.length - 1].idUtilisateur;

    const ids = profils.map((p) => p.idUtilisateur);
    const emails = profils.map((p) => p.email).filter(Boolean);
    const profilMap = new Map(profils.map((p) => [p.idUtilisateur, p]));

    const [sessions7j, tentatives24h] = await Promise.all([
      db
        .select({
          idUtilisateur: sessionsUtilisateur.idUtilisateur,
          adresseIp: sessionsUtilisateur.adresseIp,
          paysConnexion: sessionsUtilisateur.paysConnexion,
          villeConnexion: sessionsUtilisateur.villeConnexion,
          dateCreation: sessionsUtilisateur.dateCreation,
          dateExpiration: sessionsUtilisateur.dateExpiration,
        })
        .from(sessionsUtilisateur)
        .where(
          and(
            inArray(sessionsUtilisateur.idUtilisateur, ids),
            gte(sessionsUtilisateur.dateCreation, d7),
          ),
        ),
      (async () => {
        try {
          return await db
            .select({
              email: tentativesConnexion.email,
              idUtilisateur: tentativesConnexion.idUtilisateur,
              adresseIp: tentativesConnexion.adresseIp,
              motif: tentativesConnexion.motif,
              dateCreation: tentativesConnexion.dateCreation,
            })
            .from(tentativesConnexion)
            .where(
              and(
                gte(tentativesConnexion.dateCreation, d1),
                or(
                  inArray(tentativesConnexion.idUtilisateur, ids),
                  emails.length
                    ? inArray(tentativesConnexion.email, emails)
                    : sql`false`,
                ),
              ),
            );
        } catch {
          return [];
        }
      })(),
    ]);

    const emailToId = new Map(
      profils.filter((p) => p.email).map((p) => [p.email, p.idUtilisateur]),
    );

    const byUser = new Map();
    const ensure = (id) => {
      if (!id || !profilMap.has(id)) return null;
      if (!byUser.has(id)) {
        byUser.set(id, {
          idUtilisateur: id,
          sessionsActives: 0,
          ipsActives: new Set(),
          ips7j: new Set(),
          lieux: new Set(),
          connexions: [],
          sessions24h: 0,
          echecs1h: 0,
          echecs24h: 0,
          echecsTimestamps: [],
        });
      }
      return byUser.get(id);
    };

    for (const s of sessions7j) {
      const u = ensure(s.idUtilisateur);
      if (!u) continue;
      const created = s.dateCreation ? new Date(s.dateCreation) : null;
      if (s.dateExpiration && new Date(s.dateExpiration) >= now) {
        u.sessionsActives += 1;
        if (s.adresseIp) u.ipsActives.add(String(s.adresseIp));
      }
      if (created && created >= d1) u.sessions24h += 1;
      if (s.adresseIp) u.ips7j.add(String(s.adresseIp));
      const lieu = [s.villeConnexion, s.paysConnexion].filter(Boolean).join(", ");
      if (lieu) u.lieux.add(lieu);
      u.connexions.push({
        adresseIp: s.adresseIp || null,
        paysConnexion: s.paysConnexion || null,
        villeConnexion: s.villeConnexion || null,
        pays: s.paysConnexion || null,
        ville: s.villeConnexion || null,
        dateConnexion: s.dateCreation,
      });
    }

    for (const t of tentatives24h) {
      const id = t.idUtilisateur || emailToId.get(t.email);
      const u = ensure(id);
      if (!u) continue;
      u.echecs24h += 1;
      const at = t.dateCreation ? new Date(t.dateCreation) : null;
      if (at && at >= h1) u.echecs1h += 1;
      if (at) u.echecsTimestamps.push(at.getTime());
    }

    // Contexte global par IP, uniquement pour les IP observées dans ce lot.
    // On ne charge pas toutes les sessions de la plateforme en mémoire.
    const candidateIps = new Set();
    for (const u of byUser.values()) {
      for (const ip of u.ips7j) candidateIps.add(ip);
      for (const ip of u.ipsActives) candidateIps.add(ip);
    }
    for (const t of tentatives24h) if (t.adresseIp) candidateIps.add(String(t.adresseIp));

    const ipContext = new Map();
    if (candidateIps.size) {
      const ips = [...candidateIps];
      const [successRows, failedRows] = await Promise.all([
        db
          .select({
            ip: sessionsUtilisateur.adresseIp,
            accounts: countDistinct(sessionsUtilisateur.idUtilisateur),
          })
          .from(sessionsUtilisateur)
          .where(
            and(
              gte(sessionsUtilisateur.dateCreation, d7),
              inArray(sessionsUtilisateur.adresseIp, ips),
            ),
          )
          .groupBy(sessionsUtilisateur.adresseIp),
        (async () => {
          try {
            return await db
              .select({
                ip: tentativesConnexion.adresseIp,
                failedAttempts: count(),
                failedAccounts: countDistinct(tentativesConnexion.idUtilisateur),
              })
              .from(tentativesConnexion)
              .where(
                and(
                  gte(tentativesConnexion.dateCreation, d1),
                  inArray(tentativesConnexion.adresseIp, ips),
                ),
              )
              .groupBy(tentativesConnexion.adresseIp);
          } catch {
            return [];
          }
        })(),
      ]);

      for (const r of successRows) {
        if (!r.ip) continue;
        ipContext.set(String(r.ip), {
          successfulAccountsByIp: Number(r.accounts || 0),
          failedAccountsByIp: 0,
          failedAttemptsByIp: 0,
          rapidSessionsByIp: 0,
        });
      }
      for (const r of failedRows) {
        if (!r.ip) continue;
        const key = String(r.ip);
        const prev = ipContext.get(key) || {
          successfulAccountsByIp: 0,
          failedAccountsByIp: 0,
          failedAttemptsByIp: 0,
          rapidSessionsByIp: 0,
        };
        prev.failedAccountsByIp = Number(r.failedAccounts || 0);
        prev.failedAttemptsByIp = Number(r.failedAttempts || 0);
        ipContext.set(key, prev);
      }
    }

    for (const profil of profils) {
      const agg = ensure(profil.idUtilisateur);
      const hasEvidence = Boolean(
        profil.derniereConnexion ||
          agg?.connexions?.length ||
          agg?.echecs24h ||
          agg?.sessionsActives,
      );

      // Un compte sans activité exploitable n'est pas artificiellement normal.
      if (!hasEvidence) {
        totals.nonAnalyzedAccounts += 1;
        continue;
      }

      const safeAgg = agg || {
        idUtilisateur: profil.idUtilisateur,
        sessionsActives: 0,
        ipsActives: new Set(),
        ips7j: new Set(),
        lieux: new Set(),
        connexions: [],
        sessions24h: 0,
        echecs1h: 0,
        echecs24h: 0,
        echecsTimestamps: [],
      };

      const ts = safeAgg.echecsTimestamps.sort((a, b) => a - b);
      const fen = T.autoFenetreMs;
      let maxWin = 0;
      let j = 0;
      for (let i = 0; i < ts.length; i++) {
        while (j < i && ts[i] - ts[j] > fen) j += 1;
        maxWin = Math.max(maxWin, i - j + 1);
      }
      safeAgg.echecsFenetreCourte = maxWin;
      safeAgg.regulariteScore = scoreRegulariteIntervalles(ts);

      let best = {
        multiAccountsSameIp: 0,
        successfulAccountsByIp: 0,
        failedAccountsByIp: 0,
        failedAttemptsByIp: 0,
        rapidSessionsByIp: 0,
      };
      const ips = new Set([...safeAgg.ips7j, ...safeAgg.ipsActives]);
      for (const t of tentatives24h) {
        if ((t.idUtilisateur || emailToId.get(t.email)) === profil.idUtilisateur && t.adresseIp) {
          ips.add(String(t.adresseIp));
        }
      }
      for (const ip of ips) {
        const ctx = ipContext.get(String(ip));
        if (!ctx) continue;
        const multi = Math.max(
          Number(ctx.successfulAccountsByIp || 0),
          Number(ctx.failedAccountsByIp || 0),
        );
        if (multi > best.multiAccountsSameIp) {
          best = { multiAccountsSameIp: multi, ...ctx };
        }
      }

      const behavioral = computeBehavioralScores(safeAgg, profil, T, best);
      const niveau = behavioral.niveau || "normal";
      if (Object.prototype.hasOwnProperty.call(totals, niveau)) totals[niveau] += 1;
      else totals.normal += 1;
      totals.analyzedAccounts += 1;

      const item = {
        idUtilisateur: profil.idUtilisateur,
        email: profil.email,
        typeUtilisateur: profil.typeUtilisateur,
        statutCompte: profil.statutCompte,
        score: behavioral.scoreGlobal,
        scoreGlobal: behavioral.scoreGlobal,
        niveau,
        niveauLegacy: behavioral.niveauLegacy,
        confiance: behavioral.confiance,
        signaux: behavioral.signaux,
        motif: behavioral.signaux.map((s) => s.label).join(" · "),
        scorePartageCompte: behavioral.scorePartageCompte,
        scoreAutomatisation: behavioral.scoreAutomatisation,
        scoreAuthentification: behavioral.scoreAuthentification,
      };
      if (behavioral.scoreGlobal >= SUSPICIOUS_THRESHOLDS.scoreAttention || niveau !== "normal") {
        totals.top.push(item);
        totals.top.sort((a, b) => b.score - a.score);
        if (totals.top.length > 5) totals.top.length = 5;
      }
    }
  }

  return {
    normal: totals.normal,
    inhabituels: totals.inhabituel,
    suspects: totals.suspect,
    partage: totals.partage_probable,
    automatisation: totals.automatisation_probable,
    attaque: totals.attaque_probable,
    critiques: totals.critique,
    comptesSuspects:
      totals.suspect +
      totals.partage_probable +
      totals.automatisation_probable +
      totals.attaque_probable +
      totals.critique,
    echecsLogin1h: await (async () => {
      try {
        const [row] = await db
          .select({ total: count() })
          .from(tentativesConnexion)
          .where(gte(tentativesConnexion.dateCreation, h1));
        return Number(row?.total || 0);
      } catch {
        return 0;
      }
    })(),
    scoreGlobalMax: totals.top[0]?.score || 0,
    top: totals.top,
    analyzedAccounts: totals.analyzedAccounts,
    nonAnalyzedAccounts: totals.nonAnalyzedAccounts,
    repartition: {
      normal: totals.normal,
      inhabituel: totals.inhabituel,
      suspect: totals.suspect,
      partage_probable: totals.partage_probable,
      automatisation_probable: totals.automatisation_probable,
      attaque_probable: totals.attaque_probable,
      critique: totals.critique,
    },
  };
}

/**
 * Cache persistant du snapshot KPI du Centre de sécurité.
 *
 * Le scoring détaillé reste calculé par le moteur existant, mais l'overview ne
 * rescane plus toute la plateforme à chaque ouverture/rafraîchissement. Le
 * snapshot est partagé entre les instances et protégé par un verrou de ligne
 * PostgreSQL : une seule instance recalcule lorsqu'il expire.
 */
const SECURITY_OVERVIEW_CACHE_TTL_MS = Math.max(
  30_000,
  Number(process.env.SECURITY_OVERVIEW_CACHE_TTL_MS || 5 * 60 * 1000),
);

let securityOverviewCacheReady;

async function ensureSecurityOverviewCache() {
  if (!securityOverviewCacheReady) {
    securityOverviewCacheReady = (async () => {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS security_overview_cache (
          cache_key varchar(32) PRIMARY KEY,
          payload jsonb NOT NULL,
          generated_at timestamptz NOT NULL DEFAULT now()
        )
      `);
      await db.execute(sql`
        INSERT INTO security_overview_cache (cache_key, payload, generated_at)
        VALUES ('global', '{}'::jsonb, to_timestamp(0))
        ON CONFLICT (cache_key) DO NOTHING
      `);
    })().catch((err) => {
      securityOverviewCacheReady = null;
      throw err;
    });
  }
  return securityOverviewCacheReady;
}

/**
 * Retourne les KPI depuis le snapshot persistant et ne lance le scan complet
 * que lorsque le snapshot est expiré. Le verrou FOR UPDATE évite les recalculs
 * concurrents entre plusieurs requêtes/instances.
 */
export async function getSecurityOverviewStats() {
  await ensureSecurityOverviewCache();

  return db.transaction(async (tx) => {
    const cacheResult = await tx.execute(sql`
      SELECT payload, generated_at
      FROM security_overview_cache
      WHERE cache_key = 'global'
      FOR UPDATE
    `);
    const cached = cacheResult.rows?.[0];

    const generatedAt = cached?.generated_at
      ? new Date(cached.generated_at)
      : new Date(0);
    const age = Date.now() - generatedAt.getTime();

    if (cached?.payload && age >= 0 && age < SECURITY_OVERVIEW_CACHE_TTL_MS) {
      return cached.payload;
    }

    const fresh = await computeSecurityOverviewStatsUncached();

    await tx.execute(sql`
      UPDATE security_overview_cache
      SET payload = ${JSON.stringify(fresh)}::jsonb, generated_at = now()
      WHERE cache_key = 'global'
    `);

    return fresh;
  });
}

/**
 * Compatibilité : les autres consommateurs gardent l'ancien contrat.
 * Les KPI de l'overview utilisent désormais getSecurityOverviewStats().
 */
export async function getSuspiciousActivityStats() {
  const stats = await getSecurityOverviewStats();
  return {
    ...stats,
    // L'ancien champ représentait uniquement la population à risque.
    // On conserve ce comportement pour les consommateurs historiques.
    comptesSuspects: stats.comptesSuspects,
  };
}

