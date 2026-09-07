import { eq, and, desc, sql, ilike, or, gte, count } from "drizzle-orm";
import { db, getCurrentTransactionExecutor } from "../../db/index.js";
import {
  notifications,
  administrateurs,
  preferencesNotificationsEntreprise,
} from "../../db/schema.js";
import { publishRealtime } from "../../utils/realtime.js";


// ---------------------------------------------------------------------------
// Préférences de notifications — espace Entreprise
// ---------------------------------------------------------------------------
// Catégories configurables (alignées UI Paramètres → Notifications) :
//   messages | candidatures | evaluations | equipe
//
// Notifications OBLIGATOIRES / critiques (sécurité, compte, légal) :
//   ne doivent PAS passer par shouldSendEntrepriseNotification.
//   Appeler creerNotification sans idEntreprise/categoriePreference,
//   ou avec skipPreferenceCheck: true.
// ---------------------------------------------------------------------------

export const DEFAULT_ENTREPRISE_NOTIF_PREFS = {
  messages: true,
  candidatures: true,
  evaluations: true,
  equipe: true,
};

export const ENTREPRISE_NOTIF_CATEGORIES = Object.keys(
  DEFAULT_ENTREPRISE_NOTIF_PREFS,
);

/** Mappe un type de notification métier vers une catégorie de préférence. */
export function categoriePreferenceForType(type) {
  if (!type) return null;
  const t = String(type).toLowerCase();
  if (
    t.startsWith("candidature_") ||
    t.includes("candidature") ||
    t === "recommandation_recue"
  ) {
    return "candidatures";
  }
  if (
    t.startsWith("evaluation_") ||
    t.includes("evaluation") ||
    t === "rappel_evaluation_stage"
  ) {
    return "evaluations";
  }
  if (t.includes("message") || t.includes("conversation")) {
    return "messages";
  }
  if (
    t.includes("equipe") ||
    t.includes("invitation_membre") ||
    t.includes("membre_equipe")
  ) {
    return "equipe";
  }
  return null;
}

/**
 * Lit les préférences d'une entreprise. Si aucune ligne n'existe, retourne
 * les valeurs par défaut (sans créer de ligne — création lazy au premier PATCH).
 */
export async function getEntrepriseNotifPrefs(idEntreprise) {
  if (!idEntreprise) return { ...DEFAULT_ENTREPRISE_NOTIF_PREFS };

  const [row] = await db
    .select({
      messages: preferencesNotificationsEntreprise.messages,
      candidatures: preferencesNotificationsEntreprise.candidatures,
      evaluations: preferencesNotificationsEntreprise.evaluations,
      equipe: preferencesNotificationsEntreprise.equipe,
    })
    .from(preferencesNotificationsEntreprise)
    .where(eq(preferencesNotificationsEntreprise.idEntreprise, idEntreprise))
    .limit(1);

  if (!row) return { ...DEFAULT_ENTREPRISE_NOTIF_PREFS };
  return {
    messages: row.messages,
    candidatures: row.candidatures,
    evaluations: row.evaluations,
    equipe: row.equipe,
  };
}

/**
 * Upsert des préférences. `patch` peut être partiel (seules les clés fournies
 * sont mises à jour). Retourne l'état complet après sauvegarde.
 */
export async function updateEntrepriseNotifPrefs(idEntreprise, patch = {}) {
  if (!idEntreprise) {
    const err = new Error("Entreprise introuvable");
    err.status = 404;
    throw err;
  }

  const allowed = {};
  for (const key of ENTREPRISE_NOTIF_CATEGORIES) {
    if (Object.prototype.hasOwnProperty.call(patch, key)) {
      if (typeof patch[key] !== "boolean") {
        const err = new Error(`La préférence "${key}" doit être un booléen`);
        err.status = 422;
        throw err;
      }
      allowed[key] = patch[key];
    }
  }

  if (Object.keys(allowed).length === 0) {
    return getEntrepriseNotifPrefs(idEntreprise);
  }

  const current = await getEntrepriseNotifPrefs(idEntreprise);
  const next = { ...current, ...allowed };

  const [existing] = await db
    .select({ idPreference: preferencesNotificationsEntreprise.idPreference })
    .from(preferencesNotificationsEntreprise)
    .where(eq(preferencesNotificationsEntreprise.idEntreprise, idEntreprise))
    .limit(1);

  if (existing) {
    await db
      .update(preferencesNotificationsEntreprise)
      .set({ ...allowed, dateMaj: new Date() })
      .where(eq(preferencesNotificationsEntreprise.idEntreprise, idEntreprise));
  } else {
    await db.insert(preferencesNotificationsEntreprise).values({
      idEntreprise,
      ...next,
    });
  }

  return next;
}

/**
 * Vérifie si une notification configurable doit être envoyée à l'entreprise.
 * @returns {Promise<boolean>}
 */
export async function shouldSendEntrepriseNotification(idEntreprise, category) {
  if (!idEntreprise || !category) return true;
  if (!ENTREPRISE_NOTIF_CATEGORIES.includes(category)) return true;
  const prefs = await getEntrepriseNotifPrefs(idEntreprise);
  return prefs[category] !== false;
}

// Appelée depuis les autres modules (entretiens, etc.) au moment d'un
// évènement métier — jamais exposée directement via une route HTTP.
/**
 * Crée une notification persistée.
 *
 * @param {object} data
 * @param {import("drizzle-orm").NodePgDatabase | typeof db} [executor=db]
 *   Passer le client de transaction `tx` lorsque la notification doit être
 *   atomique avec une opération métier. Hors transaction, laisser `db`.
 *
 * Le push temps réel (SSE/WS) n'est émis que hors transaction (executor === db),
 * afin d'éviter d'annoncer une notification encore non commitée. Après un
 * `db.transaction`, appeler `emitNotificationCreated(notif)` pour chaque
 * notification créée via `tx`.
 */
export async function creerNotification(
  {
    idUtilisateur,
    type,
    titre,
    message,
    lien,
    idEntreprise = null,
    categoriePreference = null,
    skipPreferenceCheck = false,
  },
  executor = getCurrentTransactionExecutor() || db,
) {
  // Respect des préférences entreprise (notifications configurables uniquement)
  if (!skipPreferenceCheck && idEntreprise) {
    const cat =
      categoriePreference || categoriePreferenceForType(type);
    if (cat) {
      const allowed = await shouldSendEntrepriseNotification(
        idEntreprise,
        cat,
      );
      if (!allowed) {
        return null;
      }
    }
  }

  const [notif] = await executor
    .insert(notifications)
    .values({ idUtilisateur, type, titre, message, lien: lien || null })
    .returning();

  // Temps réel uniquement hors transaction (évite d'annoncer un rollback)
  if (notif && executor === db) {
    emitNotificationCreated(notif);
  }

  return notif;
}

/** Diffuse une notification déjà commitée (après transaction). */
export function emitNotificationCreated(notif) {
  if (!notif?.idUtilisateur) return;
  publishRealtime(notif.idUtilisateur, {
    type: "notification.created",
    payload: {
      idNotification: notif.idNotification,
      type: notif.type,
      titre: notif.titre,
      message: notif.message,
      lien: notif.lien,
      lu: notif.lu,
      dateCreation: notif.dateCreation,
    },
  });
}

// Notifie tous les comptes administrateur d'un coup (file de modération
// partagée : offres finales à valider, signalements à traiter...).
export async function notifierAdmins(
  { type, titre, message, lien },
  executor = db,
) {
  // Lecture des admins : hors tx acceptable (liste stable)
  const tousLesAdmins = await db
    .select({ idUtilisateur: administrateurs.idUtilisateur })
    .from(administrateurs);

  const created = [];
  for (const a of tousLesAdmins) {
    const n = await creerNotification(
      {
        idUtilisateur: a.idUtilisateur,
        type,
        titre,
        message,
        lien,
      },
      executor,
    );
    if (n) created.push(n);
  }

  // Si on était dans une transaction, le caller doit émettre le realtime après COMMIT.
  // Si executor === db, creerNotification a déjà émis.
  return created;
}

export async function listNotifications(idUtilisateur, { limite = 30 } = {}) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.idUtilisateur, idUtilisateur))
    .orderBy(desc(notifications.dateCreation))
    .limit(limite);
}

export async function compterNonLues(idUtilisateur) {
  const [{ count }] = await db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(notifications)
    .where(
      and(
        eq(notifications.idUtilisateur, idUtilisateur),
        eq(notifications.lu, false),
      ),
    );
  return count;
}

export async function marquerCommeLue(idUtilisateur, idNotification) {
  const [notif] = await db
    .update(notifications)
    .set({ lu: true })
    .where(
      and(
        eq(notifications.idNotification, idNotification),
        eq(notifications.idUtilisateur, idUtilisateur),
      ),
    )
    .returning();

  if (!notif) {
    const err = new Error("Notification introuvable");
    err.status = 404;
    throw err;
  }
  return notif;
}

export async function marquerToutesCommeLues(idUtilisateur) {
  await db
    .update(notifications)
    .set({ lu: true })
    .where(
      and(
        eq(notifications.idUtilisateur, idUtilisateur),
        eq(notifications.lu, false),
      ),
    );
}

export async function supprimerNotification(idUtilisateur, idNotification) {
  const [notif] = await db
    .delete(notifications)
    .where(
      and(
        eq(notifications.idNotification, idNotification),
        eq(notifications.idUtilisateur, idUtilisateur),
      ),
    )
    .returning();

  if (!notif) {
    const err = new Error("Notification introuvable");
    err.status = 404;
    throw err;
  }
  return notif;
}

export async function supprimerToutesNotifications(idUtilisateur) {
  await db
    .delete(notifications)
    .where(eq(notifications.idUtilisateur, idUtilisateur));
}


/** Dérive catégorie / priorité à partir du type et du titre (sans colonne DB). */
export function deriveNotifMeta(type, titre = "") {
  const t = `${type || ""} ${titre || ""}`.toLowerCase();
  let categorie = "systeme";
  if (t.includes("stage") || t.includes("evaluation") || t.includes("objectif"))
    categorie = "stages";
  else if (t.includes("convention")) categorie = "conventions";
  else if (t.includes("candidat")) categorie = "candidatures";
  else if (t.includes("entretien")) categorie = "entretiens";
  else if (t.includes("entreprise")) categorie = "entreprises";
  else if (t.includes("securite") || t.includes("session") || t.includes("permission"))
    categorie = "securite";
  else if (t.includes("anomal") || t.includes("controle")) categorie = "anomalies";
  else if (t.includes("utilisateur") || t.includes("compte") || t.includes("suspend"))
    categorie = "utilisateurs";
  else if (t.includes("admin") || t.includes("parametre") || t.includes("audit"))
    categorie = "administration";
  else if (t.includes("signal")) categorie = "signalements";
  else if (t.includes("offre")) categorie = "offres";

  let priorite = "info";
  if (
    t.includes("critique") ||
    t.includes("urgent") ||
    t.includes("suspend") ||
    t.includes("refus")
  )
    priorite = "critique";
  else if (
    t.includes("anomal") ||
    t.includes("retard") ||
    t.includes("incoher") ||
    t.includes("attention")
  )
    priorite = "important";
  else if (
    t.includes("attente") ||
    t.includes("validation") ||
    t.includes("action")
  )
    priorite = "attention";

  return { categorie, priorite };
}

/**
 * Liste paginée + filtres pour le centre admin (destinataire = admin connecté).
 */
export async function listNotificationsAdmin(idUtilisateur, filters = {}) {
  const {
    recherche,
    statut, // non_lues | lues | toutes
    page = 1,
    limit = 25,
  } = filters;

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 25));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [eq(notifications.idUtilisateur, idUtilisateur)];
  if (statut === "non_lues") conditions.push(eq(notifications.lu, false));
  if (statut === "lues") conditions.push(eq(notifications.lu, true));
  if (recherche && String(recherche).trim()) {
    const q = `%${String(recherche).trim()}%`;
    conditions.push(
      or(
        ilike(notifications.titre, q),
        ilike(notifications.message, q),
        ilike(notifications.type, q),
      ),
    );
  }

  const whereClause = and(...conditions);

  const [rows, countRows] = await Promise.all([
    db
      .select()
      .from(notifications)
      .where(whereClause)
      .orderBy(desc(notifications.dateCreation))
      .limit(limitNum)
      .offset(offset),
    db.select({ total: count() }).from(notifications).where(whereClause),
  ]);

  const items = rows.map((n) => {
    const meta = deriveNotifMeta(n.type, n.titre);
    return {
      idNotification: n.idNotification,
      type: n.type,
      titre: n.titre,
      message: n.message,
      lien: n.lien,
      lu: n.lu,
      dateCreation: n.dateCreation,
      categorie: meta.categorie,
      priorite: meta.priorite,
    };
  });

  // filtre priorite / categorie côté mémoire (colonnes dérivées)
  let filtered = items;
  if (filters.priorite && filters.priorite !== "toutes") {
    filtered = filtered.filter((i) => i.priorite === filters.priorite);
  }
  if (filters.categorie && filters.categorie !== "toutes") {
    filtered = filtered.filter((i) => i.categorie === filters.categorie);
  }

  const total = Number(countRows[0]?.total || 0);

  return {
    notifications: filtered,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
    },
  };
}

/**
 * Stats Centre de notifications Admin.
 * - nonLues / total : COUNT(*) SQL exact (indépendant de la pagination / limit 500)
 * - prioriteItems : aperçu (échantillon récent non lu) pour la file prioritaire UI
 */
export async function getNotificationsAdminStats(idUtilisateur) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Compteurs exacts — jamais filter en mémoire sur un sous-ensemble paginé
  const [[totalRow], [nonLuesRow], [todayRow]] = await Promise.all([
    db
      .select({ total: count() })
      .from(notifications)
      .where(eq(notifications.idUtilisateur, idUtilisateur)),
    db
      .select({ total: count() })
      .from(notifications)
      .where(
        and(
          eq(notifications.idUtilisateur, idUtilisateur),
          eq(notifications.lu, false),
        ),
      ),
    db
      .select({ total: count() })
      .from(notifications)
      .where(
        and(
          eq(notifications.idUtilisateur, idUtilisateur),
          gte(notifications.dateCreation, today),
        ),
      ),
  ]);

  // Échantillon pour file prioritaire / priorités dérivées (métadonnées type)
  const sample = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.idUtilisateur, idUtilisateur),
        eq(notifications.lu, false),
      ),
    )
    .orderBy(desc(notifications.dateCreation))
    .limit(100);

  const enriched = sample.map((n) => ({
    ...n,
    ...deriveNotifMeta(n.type, n.titre),
  }));

  const prioritaires = enriched.filter(
    (n) => n.priorite === "critique" || n.priorite === "important",
  ).length;
  const actions = enriched.filter(
    (n) =>
      n.priorite === "critique" ||
      n.priorite === "important" ||
      n.priorite === "attention",
  ).length;

  const prioriteItems = enriched
    .filter((n) => n.priorite === "critique" || n.priorite === "important")
    .slice(0, 5)
    .map((n) => ({
      idNotification: n.idNotification,
      titre: n.titre,
      message: n.message,
      type: n.type,
      lien: n.lien,
      priorite: n.priorite,
      categorie: n.categorie,
      dateCreation: n.dateCreation,
    }));

  return {
    total: Number(totalRow?.total || 0),
    nonLues: Number(nonLuesRow?.total || 0),
    aujourdhui: Number(todayRow?.total || 0),
    prioritaires,
    actionsRequises: actions,
    prioriteItems,
  };
}
