/**
 * Cycle de vie temporel des stages — source de vérité unique.
 *
 * Statuts persistés (enum statut_stage) :
 *   a_venir | actif | termine | interrompu
 *
 * Règles (fuseau Africa/Douala — Cameroun, WAT) :
 *   - interrompu : statut administratif, jamais recalculé automatiquement
 *   - date calendaire aujourd'hui < dateDebut     → a_venir
 *   - dateDebut ≤ aujourd'hui ≤ dateFinPrevue     → actif
 *   - aujourd'hui > dateFinPrevue                   → termine
 *
 * Les colonnes dateDebut / dateFinPrevue sont de type DATE (sans heure).
 * On compare des jours calendaires dans le fuseau applicatif, jamais
 * new Date() brut en UTC contre une date locale.
 */

import { isValidCalendarYmd, parseStrictYmd } from "./dateValidation.js";

export const STAGE_TZ = "Africa/Douala";

/** @returns {string} YYYY-MM-DD dans le fuseau Africa/Douala */
export function todayYmdInAppTz(now = new Date()) {
  // en-CA → YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: STAGE_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/**
 * Normalise une valeur date (Date | string ISO | YYYY-MM-DD) en YYYY-MM-DD.
 * Pour les DATE PostgreSQL renvoyées comme "2026-08-25" ou Date UTC minuit.
 */
export function toYmd(value) {
  // Délègue à parseStrictYmd (rejette 2026-02-31, années hors bornes métier, etc.)
  // Bornes larges ici pour lecture DB historique ; les asserts d'écriture sont plus stricts.
  return parseStrictYmd(value, { yearMin: 2000, yearMax: 2100 });
}

/**
 * Calcule le statut temporel métier à partir des dates + statut stocké.
 * @param {{ dateDebut, dateFinPrevue, dateFinReelle?, statut? }} stage
 * @param {Date} [now]
 * @returns {"a_venir"|"actif"|"termine"|"interrompu"}
 */
export function getStageLifecycleStatus(stage, now = new Date()) {
  if (!stage) return null;

  const stored = stage.statut;
  // Interruption manuelle : ne pas écraser
  if (stored === "interrompu") return "interrompu";

  // Clôture manuelle déjà enregistrée
  if (stored === "termine" && stage.dateFinReelle) return "termine";

  const today = todayYmdInAppTz(now);
  const debut = toYmd(stage.dateDebut);
  const fin = toYmd(stage.dateFinPrevue || stage.dateFinReelle);

  if (!debut) {
    // Pas de date de début → on conserve le stocké ou actif par défaut
    return stored === "termine" ? "termine" : stored || "actif";
  }

  if (today < debut) return "a_venir";

  if (fin && today > fin) return "termine";

  return "actif";
}

/**
 * Statut initial à la création d'un stage (jamais forcé à actif si futur).
 */
export function computeInitialStageStatus(dateDebut, dateFinPrevue, now = new Date()) {
  return getStageLifecycleStatus(
    { dateDebut, dateFinPrevue, statut: null },
    now,
  );
}

/**
 * true si les actions de suivi (journal, messages, évaluations en cours)
 * sont autorisées.
 */
export function isStageActivelyRunning(stage, now = new Date()) {
  return getStageLifecycleStatus(stage, now) === "actif";
}

/**
 * true si le stage n'a pas encore commencé.
 */
export function isStageUpcoming(stage, now = new Date()) {
  return getStageLifecycleStatus(stage, now) === "a_venir";
}

/**
 * Jours restants avant le début (0 si déjà commencé ou passé).
 */
export function daysUntilStart(stage, now = new Date()) {
  const today = todayYmdInAppTz(now);
  const debut = toYmd(stage?.dateDebut);
  if (!debut || today >= debut) return 0;
  const t0 = Date.parse(`${today}T12:00:00Z`);
  const t1 = Date.parse(`${debut}T12:00:00Z`);
  return Math.max(0, Math.round((t1 - t0) / 86_400_000));
}

/**
 * Libellé FR pour le frontend / notifications.
 */
export function stageStatusLabel(status) {
  switch (status) {
    case "a_venir":
      return "À venir";
    case "actif":
      return "Actif";
    case "termine":
      return "Terminé";
    case "interrompu":
      return "Interrompu";
    default:
      return status || "—";
  }
}

/**
 * Lève une erreur 403 si le stage n'est pas en cours (actif).
 */
export function assertStageIsActive(stage, message) {
  if (!isStageActivelyRunning(stage)) {
    const status = getStageLifecycleStatus(stage);
    const err = new Error(
      message ||
        (status === "a_venir"
          ? "Ce stage n'a pas encore commencé. Les actions de suivi seront disponibles à partir de la date de début."
          : "Ce stage n'est pas actif."),
    );
    err.status = 403;
    err.code = "STAGE_NOT_ACTIVE";
    err.statutStage = status;
    throw err;
  }
}

/**
 * Valide dateDebut ≤ dateFin (égalité = stage d'un jour autorisé).
 */
export function assertValidStageDates(dateDebut, dateFinPrevue) {
  const d = parseStrictYmd(dateDebut);
  const f = parseStrictYmd(dateFinPrevue);
  if (!d || !f) {
    const err = new Error(
      "Dates de stage invalides. Utilisez des dates calendaires réelles (AAAA-MM-JJ).",
    );
    err.status = 400;
    throw err;
  }
  if (d > f) {
    const err = new Error(
      "La date de début doit être antérieure ou égale à la date de fin.",
    );
    err.status = 400;
    throw err;
  }
}

/**
 * Ajoute N mois calendaires à une date YYYY-MM-DD en clampant le jour
 * (ex. 31 jan + 1 mois → 28/29 fév, pas de débordement en mars).
 * @param {string} ymd - YYYY-MM-DD
 * @param {number} months - entier ≥ 0
 * @returns {string} YYYY-MM-DD
 */
export function addMonthsYmd(ymd, months) {
  const d = toYmd(ymd);
  if (!d || !Number.isFinite(months) || months < 0) {
    const err = new Error("Date ou durée invalide");
    err.status = 400;
    throw err;
  }
  const [y, m, day] = d.split("-").map(Number);
  const totalMonths = m - 1 + months;
  const newY = y + Math.floor(totalMonths / 12);
  const newM = (totalMonths % 12) + 1;
  // Dernier jour du mois cible (jour 0 du mois suivant en UTC)
  const lastDay = new Date(Date.UTC(newY, newM, 0)).getUTCDate();
  const newDay = Math.min(day, lastDay);
  return `${newY}-${String(newM).padStart(2, "0")}-${String(newDay).padStart(2, "0")}`;
}

const DUREE_MOIS = { "1_mois": 1, "2_mois": 2, "3_mois": 3 };

/**
 * Calcule dateFinPrevue (YYYY-MM-DD) à partir de dateDebut + dureeStage contractuelle.
 * @param {string|Date} dateDebut
 * @param {"1_mois"|"2_mois"|"3_mois"} dureeStage
 * @returns {string} YYYY-MM-DD
 */
export function calculerDateFinPrevueYmd(dateDebut, dureeStage) {
  const mois = DUREE_MOIS[dureeStage];
  if (!mois) {
    const err = new Error(
      "Durée de stage non supportée (attendu : 1_mois, 2_mois ou 3_mois)",
    );
    err.status = 400;
    throw err;
  }
  const debut = toYmd(dateDebut);
  if (!debut) {
    const err = new Error("Date de début invalide");
    err.status = 400;
    throw err;
  }
  return addMonthsYmd(debut, mois);
}
