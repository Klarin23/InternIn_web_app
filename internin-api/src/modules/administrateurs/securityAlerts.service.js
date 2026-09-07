/**
 * Alertes de sécurité Admin.
 * Consomme les résultats du moteur computeBehavioralScores (sans le modifier).
 * Déduplication par fingerprint stable (1 alerte active / compte).
 */
import { eq, and, desc, inArray, sql, ne } from "drizzle-orm";
import { db } from "../../db/index.js";
import { alertesSecurite } from "../../db/schema.js";
import { notifierAdmins } from "../notifications/notifications.service.js";
import { logAdminAction } from "./auditAdmin.service.js";

const GRAVITE_RANK = {
  information: 0,
  attention: 1,
  important: 2,
  critique: 3,
};

/** Map classification moteur → gravité alerte (pas de nouveaux seuils). */
export function graviteFromNiveau(niveau) {
  switch (niveau) {
    case "critique":
    case "attaque_probable":
      return "critique";
    case "partage_probable":
    case "automatisation_probable":
    case "suspect":
      return "important";
    case "inhabituel":
      return "attention";
    default:
      return null; // normal → pas d'alerte
  }
}

export function typeFromNiveau(niveau) {
  switch (niveau) {
    case "partage_probable":
      return "partage_compte";
    case "automatisation_probable":
      return "automatisation";
    case "attaque_probable":
      return "attaque";
    case "critique":
      return "critique";
    case "suspect":
      return "suspect";
    case "inhabituel":
      return "inhabituel";
    default:
      return "comportement";
  }
}

export function titreFromNiveau(niveau) {
  switch (niveau) {
    case "critique":
      return "Activité de sécurité critique détectée";
    case "attaque_probable":
      return "Suspicion d'attaque automatisée";
    case "partage_probable":
      return "Suspicion de partage de compte";
    case "automatisation_probable":
      return "Suspicion d'automatisation";
    case "suspect":
      return "Activité suspecte détectée";
    case "inhabituel":
      return "Activité inhabituelle détectée";
    default:
      return "Signal de sécurité";
  }
}

export function fingerprintForCompte(idUtilisateur) {
  return `compte:${idUtilisateur}:security`;
}

/**
 * Upsert dédupliqué à partir d'un compte scoré par le moteur existant.
 * @returns {{ created: boolean, upgraded: boolean, alerte: object|null }}
 */
export async function upsertAlerteFromCompte(compte) {
  const id = compte.idUtilisateur || compte.id;
  if (!id) return { created: false, upgraded: false, alerte: null };

  const niveau = compte.niveau || "normal";
  const gravite = graviteFromNiveau(niveau);
  if (!gravite) return { created: false, upgraded: false, alerte: null };

  const fingerprint = fingerprintForCompte(id);
  const signaux = Array.isArray(compte.signaux)
    ? compte.signaux
    : Array.isArray(compte.raisons)
      ? compte.raisons
      : [];
  const scoreGlobal = Number(compte.scoreGlobal ?? compte.score ?? 0);
  const now = new Date();

  const [existing] = await db
    .select()
    .from(alertesSecurite)
    .where(eq(alertesSecurite.fingerprint, fingerprint))
    .limit(1);

  if (!existing) {
    const [created] = await db
      .insert(alertesSecurite)
      .values({
        fingerprint,
        typeAlerte: typeFromNiveau(niveau),
        gravite,
        statut: "nouvelle",
        titre: titreFromNiveau(niveau),
        description:
          compte.resume ||
          compte.motif ||
          `Classification: ${niveau} · score ${scoreGlobal}`,
        idUtilisateurCible: id,
        emailCible: compte.email || null,
        nomCible: compte.nom || compte.email || null,
        niveauDetection: niveau,
        scoreGlobal,
        scorePartage: Number(compte.scorePartageCompte ?? compte.scorePartage ?? 0),
        scoreAutomatisation: Number(
          compte.scoreAutomatisation ?? 0,
        ),
        scoreAuthentification: Number(
          compte.scoreAuthentification ?? 0,
        ),
        signaux,
        nbEvenements: 1,
        metadata: {
          typeUtilisateur: compte.typeUtilisateur || null,
        },
        dateCreation: now,
        dateMaj: now,
        dateDerniereDetection: now,
        notifie: false,
      })
      .returning();
    return { created: true, upgraded: false, alerte: created };
  }

  // Alerte résolue + nouveau signal → réouvrir
  const prevRank = GRAVITE_RANK[existing.gravite] ?? 0;
  const nextRank = GRAVITE_RANK[gravite] ?? 0;
  const upgraded = nextRank > prevRank;
  const reopen =
    existing.statut === "resolue" || existing.statut === "examinee";

  const [updated] = await db
    .update(alertesSecurite)
    .set({
      gravite: upgraded ? gravite : existing.gravite,
      typeAlerte: typeFromNiveau(niveau),
      titre: titreFromNiveau(niveau),
      description:
        compte.resume ||
        compte.motif ||
        existing.description,
      niveauDetection: niveau,
      scoreGlobal,
      scorePartage: Number(compte.scorePartageCompte ?? compte.scorePartage ?? 0),
      scoreAutomatisation: Number(compte.scoreAutomatisation ?? 0),
      scoreAuthentification: Number(compte.scoreAuthentification ?? 0),
      signaux: signaux.length ? signaux : existing.signaux,
      nbEvenements: (existing.nbEvenements || 1) + 1,
      emailCible: compte.email || existing.emailCible,
      nomCible: compte.nom || compte.email || existing.nomCible,
      dateMaj: now,
      dateDerniereDetection: now,
      // réouverture si nouvelle détection après résolution
      statut: reopen ? "nouvelle" : existing.statut,
      dateResolution: reopen ? null : existing.dateResolution,
      // forcer re-notif si upgrade de gravité
      notifie: upgraded ? false : existing.notifie,
    })
    .where(eq(alertesSecurite.idAlerte, existing.idAlerte))
    .returning();

  return { created: false, upgraded, alerte: updated };
}

/**
 * Synchronise les alertes à partir de la liste scorée (listComptesARisque).
 * N'appelle PAS le moteur de scoring — consomme uniquement les résultats fournis.
 */
export async function syncSecurityAlertsFromComptes(comptes = []) {
  let created = 0;
  let upgraded = 0;
  const toNotify = [];

  for (const c of comptes) {
    const res = await upsertAlerteFromCompte(c);
    if (res.created) {
      created += 1;
      if (res.alerte && GRAVITE_RANK[res.alerte.gravite] >= GRAVITE_RANK.important) {
        toNotify.push(res.alerte);
      }
    } else if (res.upgraded && res.alerte) {
      upgraded += 1;
      toNotify.push(res.alerte);
    }
  }

  for (const a of toNotify) {
    if (a.notifie) continue;
    try {
      await notifierAdmins({
        type: "securite_alerte",
        titre:
          a.gravite === "critique"
            ? "Nouvelle alerte de sécurité critique"
            : "Nouvelle alerte de sécurité",
        message: `${a.titre}${a.nomCible ? ` — ${a.nomCible}` : ""}`,
        lien: `/centre-securite?alerte=${a.idAlerte}`,
      });
      await db
        .update(alertesSecurite)
        .set({ notifie: true, dateMaj: new Date() })
        .where(eq(alertesSecurite.idAlerte, a.idAlerte));
    } catch {
      /* non bloquant */
    }
  }

  return { created, upgraded, notified: toNotify.length };
}

export async function getSecurityAlertsStats() {
  const rows = await db
    .select({
      gravite: alertesSecurite.gravite,
      statut: alertesSecurite.statut,
      count: sql`count(*)`.mapWith(Number),
    })
    .from(alertesSecurite)
    .groupBy(alertesSecurite.gravite, alertesSecurite.statut);

  const stats = {
    critiques: 0,
    aExaminer: 0,
    enCours: 0,
    resolues: 0,
    totalOuvertes: 0,
    parGravite: { critique: 0, important: 0, attention: 0, information: 0 },
  };

  for (const r of rows || []) {
    const n = r.count || 0;
    if (r.statut === "resolue") {
      stats.resolues += n;
      continue;
    }
    stats.totalOuvertes += n;
    if (r.statut === "en_cours") stats.enCours += n;
    if (r.statut === "nouvelle" || r.statut === "examinee") {
      stats.aExaminer += n;
    }
    if (r.gravite === "critique") stats.critiques += n;
    if (stats.parGravite[r.gravite] != null) {
      stats.parGravite[r.gravite] += n;
    }
  }

  return stats;
}

export async function listSecurityAlerts({
  gravite,
  statut,
  page = 1,
  limit = 50,
} = {}) {
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 50));
  const pageNum = Math.max(1, Number(page) || 1);
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];
  if (gravite && gravite !== "toutes") {
    conditions.push(eq(alertesSecurite.gravite, gravite));
  }
  if (statut && statut !== "toutes") {
    if (statut === "ouvertes") {
      conditions.push(ne(alertesSecurite.statut, "resolue"));
    } else {
      conditions.push(eq(alertesSecurite.statut, statut));
    }
  }

  const where = conditions.length ? and(...conditions) : undefined;

  const [items, countRow] = await Promise.all([
    db
      .select()
      .from(alertesSecurite)
      .where(where)
      .orderBy(desc(alertesSecurite.dateDerniereDetection))
      .limit(limitNum)
      .offset(offset),
    db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(alertesSecurite)
      .where(where),
  ]);

  return {
    items,
    total: countRow?.[0]?.count ?? 0,
    page: pageNum,
    limit: limitNum,
  };
}

export async function getSecurityAlertById(idAlerte) {
  const [a] = await db
    .select()
    .from(alertesSecurite)
    .where(eq(alertesSecurite.idAlerte, idAlerte))
    .limit(1);
  if (!a) {
    const err = new Error("Alerte introuvable");
    err.status = 404;
    throw err;
  }
  return a;
}

export async function updateSecurityAlertStatus(
  idAdmin,
  idAlerte,
  statut,
) {
  const allowed = ["nouvelle", "examinee", "en_cours", "resolue"];
  if (!allowed.includes(statut)) {
    const err = new Error("Statut invalide");
    err.status = 400;
    throw err;
  }

  const existing = await getSecurityAlertById(idAlerte);
  const now = new Date();
  const patch = {
    statut,
    dateMaj: now,
  };
  if (statut === "examinee" || statut === "en_cours") {
    patch.dateExamen = existing.dateExamen || now;
  }
  if (statut === "resolue") {
    patch.dateResolution = now;
    patch.idAdminResolution = idAdmin;
  }

  const [updated] = await db
    .update(alertesSecurite)
    .set(patch)
    .where(eq(alertesSecurite.idAlerte, idAlerte))
    .returning();

  try {
    await logAdminAction({
      idAdministrateur: idAdmin,
      action: `ALERTE_SECURITE_${statut.toUpperCase()}`,
      typeEntite: "alerte_securite",
      idEntite: idAlerte,
      motif: `fingerprint=${existing.fingerprint}`,
    });
  } catch {
    /* non bloquant */
  }

  return updated;
}
