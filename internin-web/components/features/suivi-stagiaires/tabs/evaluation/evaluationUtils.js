/** Critères d'évaluation — alignés sur le schéma API / SoumettreEvaluationDialog */
export const CRITERES = [
  { key: "noteAssiduite", labelKey: "evaluation.criteriaLabels.assiduite" },
  { key: "noteCommunication", labelKey: "evaluation.criteriaLabels.communication" },
  { key: "noteInitiative", labelKey: "evaluation.criteriaLabels.initiative" },
  { key: "noteProfessionnalisme", labelKey: "evaluation.criteriaLabels.professionalism" },
  { key: "noteTravailEquipe", labelKey: "evaluation.criteriaLabels.teamwork" },
  { key: "notePerformanceTechnique", labelKey: "evaluation.criteriaLabels.performance" },
];

/**
 * Clé i18n pour l'appréciation d'une moyenne (1–5).
 * Réutilise suivi.overview.* déjà présentes.
 */
export function getAppreciationKey(moyenne) {
  if (moyenne == null || Number.isNaN(moyenne)) return null;
  if (moyenne < 1.5) return "suivi.overview.levelInsufficient";
  if (moyenne < 2.5) return "suivi.overview.toImprove";
  if (moyenne < 3.5) return "suivi.overview.levelFair";
  if (moyenne < 4.5) return "suivi.overview.veryGood";
  return "suivi.overview.levelExcellent";
}

/** @deprecated utiliser getAppreciationKey + t() */
export function getAppreciation(moyenne) {
  return getAppreciationKey(moyenne);
}

/** Moyenne d'une évaluation (notes 1–5 présentes uniquement) */
export function moyenneEvaluation(evalu) {
  if (!evalu) return null;
  const values = CRITERES.map(({ key }) => evalu[key]).filter(
    (n) => typeof n === "number" && !Number.isNaN(n),
  );
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Moyenne globale sur toutes les évaluations */
export function moyenneGlobale(evaluations) {
  if (!evaluations?.length) return null;
  const moyennes = evaluations
    .map(moyenneEvaluation)
    .filter((m) => m != null);
  if (moyennes.length === 0) return null;
  return moyennes.reduce((a, b) => a + b, 0) / moyennes.length;
}

/** Moyenne par critère sur l'historique */
export function moyennesParCritere(evaluations) {
  if (!evaluations?.length) return {};
  const result = {};
  for (const { key } of CRITERES) {
    const vals = evaluations
      .map((e) => e[key])
      .filter((n) => typeof n === "number" && !Number.isNaN(n));
    result[key] =
      vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  }
  return result;
}

/** Progression % entre première et dernière évaluation (moyennes) */
export function progressionPourcent(evaluations) {
  if (!evaluations || evaluations.length < 2) return null;
  const sorted = [...evaluations].sort(
    (a, b) => (a.numeroSemaine || 0) - (b.numeroSemaine || 0),
  );
  const first = moyenneEvaluation(sorted[0]);
  const last = moyenneEvaluation(sorted[sorted.length - 1]);
  if (first == null || last == null || first === 0) return null;
  return ((last - first) / first) * 100;
}

/**
 * Date relative → { key, params } pour t(key, params)
 * Clés : suivi.rel.today | yesterday | daysAgo | weeksAgo | monthsAgo
 */
export function formatRelativeDate(dateSoumission) {
  if (!dateSoumission) return null;
  const d = new Date(dateSoumission);
  if (Number.isNaN(d.getTime())) return null;
  const diffMs = Date.now() - d.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days < 0) return null;
  if (days === 0) return { key: "suivi.rel.today", params: {} };
  if (days === 1) return { key: "suivi.rel.yesterday", params: {} };
  if (days < 7) return { key: "suivi.rel.daysAgo", params: { count: days } };
  if (days < 30) {
    const w = Math.max(1, Math.floor(days / 7));
    return { key: "suivi.rel.weeksAgo", params: { count: w } };
  }
  const m = Math.max(1, Math.floor(days / 30));
  return { key: "suivi.rel.monthsAgo", params: { count: m } };
}

/** Date absolue selon locale active (fr-FR / en-GB) */
export function formatDate(dateSoumission, locale) {
  if (!dateSoumission) return null;
  const d = new Date(dateSoumission);
  if (Number.isNaN(d.getTime())) return null;
  const loc = locale === "en" || locale === "en-GB" ? "en-GB" : "fr-FR";
  return d.toLocaleDateString(loc, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** @deprecated utiliser formatDate(date, locale) */
export function formatDateFr(dateSoumission) {
  return formatDate(dateSoumission, "fr");
}

export function formatNote(n) {
  if (n == null || Number.isNaN(n)) return "—";
  return Number(n).toFixed(1);
}

/** Helper UI : résout un objet relative date via t() */
export function resolveRelativeDate(rel, t) {
  if (!rel) return null;
  if (typeof rel === "string") return rel;
  if (rel.key) return t(rel.key, rel.params || {});
  return null;
}
