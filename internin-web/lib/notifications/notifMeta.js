export const NOTIF_META = {
  candidature_recue: {
    tone: "info",
    labelKey: "notifications.actions.viewCandidates",
  },
  candidature_preselectionnee: {
    tone: "success",
    labelKey: "notifications.actions.viewApplication",
  },
  candidature_rejetee: {
    tone: "error",
    labelKey: "notifications.actions.viewApplications",
  },
  candidature_consultee: {
    tone: "info",
    labelKey: "notifications.actions.view",
  },
  candidature_retiree_confirmation: {
    tone: "info",
    labelKey: "notifications.actions.viewApplications",
  },
  entretien_replanifie: {
    tone: "warning",
    labelKey: "notifications.actions.confirmDate",
  },
  entretien_planifie: {
    tone: "message",
    labelKey: "notifications.actions.viewInterview",
  },
  entretien_annule: {
    tone: "error",
    labelKey: "notifications.actions.viewInterview",
  },
  entretien: {
    tone: "message",
    labelKey: "notifications.actions.viewInterview",
  },
  entreprise_verifiee: {
    tone: "success",
    labelKey: "notifications.actions.mySpace",
  },
  entreprise_rejetee: {
    tone: "error",
    labelKey: "notifications.actions.myProfile",
  },
  universite_verifiee: {
    tone: "success",
    labelKey: "notifications.actions.mySpace",
  },
  universite_rejetee: {
    tone: "error",
    labelKey: "notifications.actions.myProfile",
  },
  convention_validee_universite: {
    tone: "success",
    labelKey: "notifications.actions.viewStage",
  },
  evaluation: {
    tone: "warning",
    labelKey: "notifications.actions.evaluate",
  },
  evaluation_soumise: {
    tone: "warning",
    labelKey: "notifications.actions.view",
  },
  journal: {
    tone: "warning",
    labelKey: "notifications.actions.verify",
  },
  message: {
    tone: "message",
    labelKey: "notifications.actions.open",
  },
  systeme: {
    tone: "system",
    labelKey: "notifications.actions.view",
  },
  offre_finale_approuvee: {
    tone: "success",
    labelKey: "notifications.actions.viewApplications",
  },
  offre_finale_recue: {
    tone: "success",
    labelKey: "notifications.actions.viewApplications",
  },
  stage_termine: {
    tone: "success",
    labelKey: "notifications.actions.view",
  },
  stage_programme: {
    tone: "info",
    labelKey: "notifications.actions.viewStage",
  },
  stage_demarre: {
    tone: "success",
    labelKey: "notifications.actions.viewStage",
  },
  proposition_stage: {
    tone: "info",
    labelKey: "notifications.actions.view",
  },
  proposition_recue: {
    tone: "info",
    labelKey: "notifications.actions.view",
  },
};

export function getNotifMeta(type = "") {
  const key = String(type || "").toLowerCase();
  if (NOTIF_META[key]) return NOTIF_META[key];
  for (const [k, meta] of Object.entries(NOTIF_META)) {
    if (key.includes(k) || key === k) return meta;
  }
  if (key.includes("rejet") || key.includes("refus")) {
    return { tone: "error", labelKey: "notifications.actions.view" };
  }
  if (key.includes("valid") || key.includes("accept") || key.includes("verif")) {
    return { tone: "success", labelKey: "notifications.actions.view" };
  }
  if (key.includes("entretien")) return NOTIF_META.entretien;
  if (key.includes("candidature")) {
    return { tone: "info", labelKey: "notifications.actions.view" };
  }
  if (key.includes("evaluation")) return NOTIF_META.evaluation;
  if (key.includes("journal")) return NOTIF_META.journal;
  if (key.includes("message")) return NOTIF_META.message;
  return { tone: "info", labelKey: "notifications.actions.open" };
}

export const TONE_CLASS = {
  error: "bg-destructive/10 text-destructive ring-destructive/20",
  warning:
    "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-400",
  success:
    "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-400",
  info: "bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-400",
  message:
    "bg-violet-500/10 text-violet-700 ring-violet-500/20 dark:text-violet-400",
  system: "bg-muted text-muted-foreground ring-border",
};

/** Couleurs des points indicateurs (badge / liste notifications) */
export const TONE_DOT = {
  error: "bg-destructive",
  warning: "bg-amber-500",
  success: "bg-emerald-500",
  info: "bg-sky-500",
  message: "bg-violet-500",
  system: "bg-muted-foreground",
};

export function formatNotifDate(date, t, locale = "fr") {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (t) {
    if (mins < 1) return t("header.justNow");
    if (mins < 60) return t("header.minutesAgo", { n: mins });
    if (hours < 24) return t("header.hoursAgo", { n: hours });
    if (days < 7) return t("header.daysAgo", { n: days });
  }
  const loc = locale === "en" ? "en-GB" : "fr-FR";
  return d.toLocaleDateString(loc, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatNotifDateLocale(date, locale = "fr", t) {
  return formatNotifDate(date, t, locale);
}
