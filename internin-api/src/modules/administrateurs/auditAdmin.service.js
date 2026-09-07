/**
 * Journal d'audit administrateur — lecture + écriture centralisée.
 * Table existante : journal_actions_admin (immutable côté API).
 */
import {
  eq,
  and,
  desc,
  gte,
  lte,
  ilike,
  or,
  sql,
  count,
  inArray,
} from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  journalActionsAdmin,
  utilisateurs,
  administrateurs,
} from "../../db/schema.js";

/** Catégories dérivées de typeEntite / action (données réelles uniquement). */
export function deriveCategorie(typeEntite, action) {
  const t = (typeEntite || "").toLowerCase();
  const a = (action || "").toLowerCase();
  if (t.includes("parametre") || a.includes("parametre")) return "parametres";
  if (t.includes("anomalie") || a.includes("anomalie")) return "securite";
  if (t.includes("entreprise")) return "entreprises";
  if (t.includes("universit")) return "universites";
  if (t.includes("utilisateur") || t.includes("user") || t.includes("compte"))
    return "utilisateurs";
  if (t.includes("offre") || t.includes("offre_finale")) return "offres";
  if (t.includes("convention")) return "conventions";
  if (t.includes("stage")) return "stages";
  if (t.includes("signal") || t.includes("litige")) return "signalements";
  if (t.includes("candidat")) return "candidatures";
  if (t.includes("entretien")) return "entretiens";
  if (a.includes("connexion") || a.includes("logout") || a.includes("session"))
    return "authentification";
  if (a.includes("export") || a.includes("permission")) return "securite";
  return t || "autre";
}

export function labelAction(action) {
  const map = {
    modification_parametres: "Modification des paramètres",
    resoudre_anomalie: "Résolution d'anomalie",
    ignorer_anomalie: "Anomalie ignorée",
    verifier_entreprise: "Vérification entreprise",
    verifier_universite: "Vérification université",
    changer_statut_compte: "Changement de statut de compte",
    suspendre: "Suspension",
    reactiver: "Réactivation",
    valider_offre: "Validation d'offre finale",
    rejeter_offre: "Rejet d'offre finale",
    export_audit: "Export du journal d'audit",
  };
  return map[action] || String(action || "Action").replace(/_/g, " ");
}

/**
 * Enregistre une action admin côté serveur uniquement.
 * Ne jamais faire confiance au frontend pour idAdministrateur / date.
 */
export async function logAdminAction({
  idAdministrateur,
  typeEntite,
  idEntite = null,
  action,
  ancienStatut = null,
  nouveauStatut = null,
  motif = null,
}) {
  if (!idAdministrateur || !action || !typeEntite) return null;
  try {
    const [row] = await db
      .insert(journalActionsAdmin)
      .values({
        idAdministrateur,
        typeEntite: String(typeEntite).slice(0, 50),
        idEntite: idEntite || null,
        action: String(action).slice(0, 100),
        ancienStatut: ancienStatut != null ? String(ancienStatut).slice(0, 50) : null,
        nouveauStatut:
          nouveauStatut != null ? String(nouveauStatut).slice(0, 50) : null,
        motif: motif != null ? String(motif).slice(0, 4000) : null,
      })
      .returning();
    return row;
  } catch (err) {
    console.error("[audit] logAdminAction failed:", err?.message);
    return null;
  }
}

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfWeek(d = new Date()) {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = day === 0 ? 6 : day - 1;
  x.setDate(x.getDate() - diff);
  return x;
}

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/**
 * Liste paginée + filtres serveur.
 */
export async function listAuditJournal(filters = {}) {
  const {
    recherche,
    typeEntite,
    action,
    idAdministrateur,
    periode, // today | 7d | 30d | 90d | year | all
    dateFrom,
    dateTo,
    page = 1,
    limit = 50,
  } = filters;

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(250, Math.max(1, Number(limit) || 50));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];

  if (idAdministrateur) {
    conditions.push(eq(journalActionsAdmin.idAdministrateur, idAdministrateur));
  }
  if (typeEntite && typeEntite !== "tous" && typeEntite !== "toutes") {
    conditions.push(eq(journalActionsAdmin.typeEntite, typeEntite));
  }
  if (action && action !== "tous" && action !== "toutes") {
    conditions.push(eq(journalActionsAdmin.action, action));
  }

  let fromDate = null;
  if (dateFrom) fromDate = new Date(dateFrom);
  else if (periode === "today") fromDate = startOfDay();
  else if (periode === "7d") fromDate = new Date(Date.now() - 7 * 86400000);
  else if (periode === "30d") fromDate = new Date(Date.now() - 30 * 86400000);
  else if (periode === "90d") fromDate = new Date(Date.now() - 90 * 86400000);
  else if (periode === "year")
    fromDate = new Date(new Date().getFullYear(), 0, 1);

  if (fromDate && !Number.isNaN(fromDate.getTime())) {
    conditions.push(gte(journalActionsAdmin.dateCreation, fromDate));
  }
  if (dateTo) {
    const to = new Date(dateTo);
    if (!Number.isNaN(to.getTime())) {
      conditions.push(lte(journalActionsAdmin.dateCreation, to));
    }
  }

  if (recherche && String(recherche).trim()) {
    const q = `%${String(recherche).trim()}%`;
    conditions.push(
      or(
        ilike(journalActionsAdmin.action, q),
        ilike(journalActionsAdmin.typeEntite, q),
        ilike(journalActionsAdmin.motif, q),
        ilike(journalActionsAdmin.ancienStatut, q),
        ilike(journalActionsAdmin.nouveauStatut, q),
        ilike(utilisateurs.email, q),
      ),
    );
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const [rows, countRows] = await Promise.all([
    db
      .select({
        idJournal: journalActionsAdmin.idJournal,
        idAdministrateur: journalActionsAdmin.idAdministrateur,
        typeEntite: journalActionsAdmin.typeEntite,
        idEntite: journalActionsAdmin.idEntite,
        action: journalActionsAdmin.action,
        ancienStatut: journalActionsAdmin.ancienStatut,
        nouveauStatut: journalActionsAdmin.nouveauStatut,
        motif: journalActionsAdmin.motif,
        dateCreation: journalActionsAdmin.dateCreation,
        adminEmail: utilisateurs.email,
      })
      .from(journalActionsAdmin)
      .leftJoin(
        utilisateurs,
        eq(journalActionsAdmin.idAdministrateur, utilisateurs.idUtilisateur),
      )
      .where(whereClause)
      .orderBy(desc(journalActionsAdmin.dateCreation))
      .limit(limitNum)
      .offset(offset),
    db
      .select({ total: count() })
      .from(journalActionsAdmin)
      .leftJoin(
        utilisateurs,
        eq(journalActionsAdmin.idAdministrateur, utilisateurs.idUtilisateur),
      )
      .where(whereClause),
  ]);

  // Noms admin depuis table administrateurs
  const adminIds = [
    ...new Set(rows.map((r) => r.idAdministrateur).filter(Boolean)),
  ];
  const noms = {};
  if (adminIds.length) {
    const admins = await db
      .select({
        idUtilisateur: administrateurs.idUtilisateur,
        nom: administrateurs.nom,
        role: administrateurs.roleAdmin,
      })
      .from(administrateurs)
      .where(inArray(administrateurs.idUtilisateur, adminIds));
    for (const a of admins) {
      noms[a.idUtilisateur] = { nom: a.nom, role: a.role };
    }
  }

  const events = rows.map((r) => ({
    idJournal: r.idJournal,
    dateCreation: r.dateCreation,
    action: r.action,
    actionLabel: labelAction(r.action),
    typeEntite: r.typeEntite,
    categorie: deriveCategorie(r.typeEntite, r.action),
    idEntite: r.idEntite,
    ancienStatut: r.ancienStatut,
    nouveauStatut: r.nouveauStatut,
    motif: r.motif,
    resultat: "success", // table sans colonne résultat — succès si enregistré
    administrateur: {
      idUtilisateur: r.idAdministrateur,
      email: r.adminEmail,
      nom: noms[r.idAdministrateur]?.nom || r.adminEmail || "Administrateur",
      role: noms[r.idAdministrateur]?.role || "administrateur",
    },
  }));

  const total = Number(countRows[0]?.total || 0);

  return {
    events,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
    },
  };
}

export async function getAuditStats() {
  const now = new Date();
  const today = startOfDay(now);
  const week = startOfWeek(now);
  const month = startOfMonth(now);

  const [[{ total: aujourdhui }], [{ total: semaine }], [{ total: mois }], [{ total: total }], adminsActifs] =
    await Promise.all([
      db
        .select({ total: count() })
        .from(journalActionsAdmin)
        .where(gte(journalActionsAdmin.dateCreation, today)),
      db
        .select({ total: count() })
        .from(journalActionsAdmin)
        .where(gte(journalActionsAdmin.dateCreation, week)),
      db
        .select({ total: count() })
        .from(journalActionsAdmin)
        .where(gte(journalActionsAdmin.dateCreation, month)),
      db.select({ total: count() }).from(journalActionsAdmin),
      db
        .select({
          idAdministrateur: journalActionsAdmin.idAdministrateur,
          n: count(),
        })
        .from(journalActionsAdmin)
        .where(gte(journalActionsAdmin.dateCreation, week))
        .groupBy(journalActionsAdmin.idAdministrateur),
    ]);

  // Actions "sensibles" heuristique sur libellés connus
  const [{ total: sensibles }] = await db
    .select({ total: count() })
    .from(journalActionsAdmin)
    .where(
      and(
        gte(journalActionsAdmin.dateCreation, month),
        or(
          ilike(journalActionsAdmin.action, "%suspend%"),
          ilike(journalActionsAdmin.action, "%parametre%"),
          ilike(journalActionsAdmin.action, "%anomalie%"),
          ilike(journalActionsAdmin.action, "%export%"),
          ilike(journalActionsAdmin.action, "%supprim%"),
          ilike(journalActionsAdmin.action, "%permission%"),
        ),
      ),
    );

  return {
    aujourdhui: Number(aujourdhui || 0),
    semaine: Number(semaine || 0),
    mois: Number(mois || 0),
    total: Number(total || 0),
    sensibles: Number(sensibles || 0),
    adminsActifs: adminsActifs.filter((a) => a.idAdministrateur).length,
  };
}

export async function getAuditEventById(idJournal) {
  const [row] = await db
    .select({
      idJournal: journalActionsAdmin.idJournal,
      idAdministrateur: journalActionsAdmin.idAdministrateur,
      typeEntite: journalActionsAdmin.typeEntite,
      idEntite: journalActionsAdmin.idEntite,
      action: journalActionsAdmin.action,
      ancienStatut: journalActionsAdmin.ancienStatut,
      nouveauStatut: journalActionsAdmin.nouveauStatut,
      motif: journalActionsAdmin.motif,
      dateCreation: journalActionsAdmin.dateCreation,
      adminEmail: utilisateurs.email,
    })
    .from(journalActionsAdmin)
    .leftJoin(
      utilisateurs,
      eq(journalActionsAdmin.idAdministrateur, utilisateurs.idUtilisateur),
    )
    .where(eq(journalActionsAdmin.idJournal, idJournal))
    .limit(1);

  if (!row) {
    const err = new Error("Événement d'audit introuvable");
    err.status = 404;
    throw err;
  }

  let adminMeta = { nom: row.adminEmail, role: "administrateur" };
  if (row.idAdministrateur) {
    const [a] = await db
      .select({ nom: administrateurs.nom, role: administrateurs.roleAdmin })
      .from(administrateurs)
      .where(eq(administrateurs.idUtilisateur, row.idAdministrateur))
      .limit(1);
    if (a) adminMeta = a;
  }

  return {
    idJournal: row.idJournal,
    dateCreation: row.dateCreation,
    action: row.action,
    actionLabel: labelAction(row.action),
    typeEntite: row.typeEntite,
    categorie: deriveCategorie(row.typeEntite, row.action),
    idEntite: row.idEntite,
    ancienStatut: row.ancienStatut,
    nouveauStatut: row.nouveauStatut,
    motif: row.motif,
    resultat: "success",
    administrateur: {
      idUtilisateur: row.idAdministrateur,
      email: row.adminEmail,
      nom: adminMeta.nom || row.adminEmail,
      role: adminMeta.role || "administrateur",
    },
  };
}

/**
 * Export CSV des résultats filtrés (plafond sécurité).
 */
export async function exportAuditJournal(filters = {}, idAdministrateur) {
  const data = await listAuditJournal({
    ...filters,
    page: 1,
    limit: 500,
  });

  await logAdminAction({
    idAdministrateur,
    typeEntite: "audit",
    action: "export_audit",
    motif: `Export ${data.events.length} événements (filtres appliqués)`,
  });

  return data.events;
}
