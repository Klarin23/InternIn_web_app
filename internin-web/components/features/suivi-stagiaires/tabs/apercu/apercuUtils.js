import {
  getAvancement,
  getJoursRestants,
  getMoyenneDerniereEvaluation,
  getStatutAffichage,
  STATUT_CONFIG,
  AVATAR_COLORS,
} from "../../stageUtils";

export {
  getAvancement,
  getJoursRestants,
  getMoyenneDerniereEvaluation,
  getStatutAffichage,
  STATUT_CONFIG,
  AVATAR_COLORS,
};

/** Returns i18n key for performance appreciation */
export function getAppreciationKey(moyenne) {
  if (moyenne == null || Number.isNaN(moyenne)) return null;
  if (moyenne < 1.5) return "suivi.overview.levelInsufficient";
  if (moyenne < 2.5) return "suivi.overview.toImprove";
  if (moyenne < 3.5) return "suivi.overview.levelFair";
  if (moyenne < 4.5) return "suivi.overview.veryGood";
  return "suivi.overview.levelExcellent";
}

/** @deprecated use getAppreciationKey + t() */
export function getAppreciation(moyenne) {
  return getAppreciationKey(moyenne);
}

export function moyenneEvaluation(evalu) {
  if (!evalu) return null;
  const notes = [
    evalu.noteAssiduite,
    evalu.noteCommunication,
    evalu.noteInitiative,
    evalu.noteProfessionnalisme,
    evalu.noteTravailEquipe,
    evalu.notePerformanceTechnique,
  ].filter((n) => typeof n === "number" && !Number.isNaN(n));
  if (notes.length === 0) return null;
  return notes.reduce((a, b) => a + b, 0) / notes.length;
}

export function progressionEvaluations(evaluations) {
  if (!evaluations || evaluations.length < 2) return null;
  const sorted = [...evaluations].sort(
    (a, b) => (a.numeroSemaine || 0) - (b.numeroSemaine || 0),
  );
  const first = moyenneEvaluation(sorted[0]);
  const last = moyenneEvaluation(sorted[sorted.length - 1]);
  if (first == null || last == null || first === 0) return null;
  return ((last - first) / first) * 100;
}

export function formatDate(value, localeTag = "fr-FR") {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return typeof value === "string" ? value : null;
  }
  return d.toLocaleDateString(localeTag, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** @deprecated prefer formatDate(value, localeTag) */
export function formatDateFr(value, localeTag = "fr-FR") {
  return formatDate(value, localeTag);
}

export function formatDateShort(value, localeTag = "fr-FR") {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return typeof value === "string" ? value : null;
  return d.toLocaleDateString(localeTag, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Returns { key, params } for relative dates — translate with t(key, params) in UI.
 */
export function formatRelativeDateParts(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days < 0) return null;
  if (days === 0) return { key: "suivi.rel.today", params: {} };
  if (days === 1) return { key: "suivi.rel.yesterday", params: {} };
  if (days < 7) return { key: "suivi.rel.daysAgo", params: { count: days } };
  if (days < 30) {
    const w = Math.floor(days / 7);
    return { key: "suivi.rel.weeksAgo", params: { count: w } };
  }
  const m = Math.floor(days / 30);
  return { key: "suivi.rel.monthsAgo", params: { count: m } };
}

/** Translate relative date when t is provided */
export function formatRelativeDate(value, t) {
  const parts = formatRelativeDateParts(value);
  if (!parts) return null;
  if (typeof t === "function") return t(parts.key, parts.params);
  return parts.key;
}

export function formatNote(n) {
  if (n == null || Number.isNaN(n)) return "—";
  return Number(n).toFixed(1);
}

export function getInitials(prenom, nom) {
  return `${(prenom || "").charAt(0)}${(nom || "").charAt(0)}`.toUpperCase();
}

export function avatarColor(seed) {
  const s = String(seed || "");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

/**
 * Highlights as { type, key, params? } — translate in UI with t(item.key, item.params)
 */
export function buildHighlights(stage, evaluations, avancement, moyenne) {
  const items = [];
  const list = Array.isArray(evaluations) ? evaluations : [];

  if (list.length > 0) {
    const last = list[list.length - 1];
    const days = last?.dateSoumission
      ? Math.floor(
          (Date.now() - new Date(last.dateSoumission).getTime()) / 86400000,
        )
      : null;
    if (days != null && !Number.isNaN(days) && days <= 14) {
      items.push({ type: "ok", key: "suivi.highlight.recentEval" });
    }
  }

  if (moyenne != null && moyenne >= 3.5) {
    items.push({ type: "ok", key: "suivi.highlight.goodPerf" });
  }

  if (stage?.statut === "actif" || stage?.statut === "en_cours") {
    const jours = getJoursRestants(stage);
    if (jours != null && jours > 0 && jours <= 14) {
      items.push({
        type: "warn",
        key: "suivi.highlight.endingSoon",
        params: { days: jours },
      });
    }
  }

  if (list.length === 0 && (stage?.statut === "actif" || !stage?.statut)) {
    items.push({ type: "warn", key: "suivi.highlight.noEval" });
  }

  if (avancement != null && avancement >= 80 && stage?.statut !== "termine") {
    items.push({ type: "ok", key: "suivi.highlight.advanced" });
  }

  return items;
}

/**
 * Activity items — titleKey/descriptionKey for i18n; description may be user comment.
 */
export function buildRecentActivity(evaluations) {
  const list = Array.isArray(evaluations) ? evaluations : [];
  return [...list]
    .map((e) => {
      const hasComment =
        e.commentaires && String(e.commentaires).trim().length > 0;
      return {
        id: e.idEvaluation,
        titleKey: "suivi.eval.weekN",
        titleParams: { n: e.numeroSemaine ?? "—" },
        description: hasComment
          ? String(e.commentaires).trim().slice(0, 120)
          : null,
        descriptionKey: hasComment ? null : "suivi.overview.weeklyEvalLogged",
        date: e.dateSoumission || null,
        numeroSemaine: e.numeroSemaine,
        type: "evaluation",
      };
    })
    .sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      if (db !== da) return db - da;
      return (b.numeroSemaine || 0) - (a.numeroSemaine || 0);
    })
    .slice(0, 6);
}
