export const NOTIF_META = {
  candidature_recue: { tone: "info", label: "Voir les candidats" },
  candidature_preselectionnee: { tone: "success", label: "Voir la candidature" },
  candidature_rejetee: { tone: "error", label: "Voir les candidatures" },
  candidature_consultee: { tone: "info", label: "Voir" },
  entretien: { tone: "message", label: "Voir l'entretien" },
  entreprise_verifiee: { tone: "success", label: "Mon espace" },
  entreprise_rejetee: { tone: "error", label: "Mon profil" },
  universite_verifiee: { tone: "success", label: "Mon espace" },
  universite_rejetee: { tone: "error", label: "Mon profil" },
  convention_validee_universite: { tone: "success", label: "Voir le stage" },
  evaluation: { tone: "warning", label: "Évaluer" },
  journal: { tone: "warning", label: "Vérifier" },
  message: { tone: "message", label: "Ouvrir" },
  systeme: { tone: "system", label: "Voir" },
};

export function getNotifMeta(type = "") {
  const t = String(type || "").toLowerCase();
  for (const [key, meta] of Object.entries(NOTIF_META)) {
    if (t.includes(key) || t === key) return meta;
  }
  if (t.includes("rejet") || t.includes("refus"))
    return { tone: "error", label: "Voir" };
  if (t.includes("valid") || t.includes("accept") || t.includes("verif"))
    return { tone: "success", label: "Voir" };
  if (t.includes("entretien")) return NOTIF_META.entretien;
  if (t.includes("candidature")) return { tone: "info", label: "Voir" };
  if (t.includes("evaluation")) return NOTIF_META.evaluation;
  if (t.includes("journal")) return NOTIF_META.journal;
  if (t.includes("message")) return NOTIF_META.message;
  return { tone: "info", label: "Ouvrir" };
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

export const TONE_DOT = {
  error: "bg-destructive",
  warning: "bg-amber-500",
  success: "bg-emerald-500",
  info: "bg-sky-500",
  message: "bg-violet-500",
  system: "bg-muted-foreground",
};

export function formatNotifDate(date, t) {
  if (!date) return "";
  const diffMs = Date.now() - new Date(date).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return t?.("header.justNow") || "À l'instant";
  if (minutes < 60)
    return t?.("header.minutesAgo", { n: minutes }) || `Il y a ${minutes} min`;
  const heures = Math.round(minutes / 60);
  if (heures < 24)
    return t?.("header.hoursAgo", { n: heures }) || `Il y a ${heures} h`;
  const jours = Math.round(heures / 24);
  if (jours === 1) return "Hier";
  if (jours < 7)
    return t?.("header.daysAgo", { n: jours }) || `Il y a ${jours} jours`;
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
