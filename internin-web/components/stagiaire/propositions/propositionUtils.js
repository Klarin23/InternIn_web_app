export const STATUT_META = {
  envoyee: {
    labelKey: "stagiaireSpace.propositions.statusNew",
    className: "bg-primary/10 text-primary border-primary/20",
    cardAccent: "border-primary/30 bg-card shadow-sm",
  },
  vue: {
    labelKey: "stagiaireSpace.propositions.statusViewed",
    className:
      "bg-amber-500/10 text-amber-800 border-amber-500/20 dark:text-amber-300",
    cardAccent: "border-amber-500/20 bg-card",
  },
  acceptee: {
    labelKey: "stagiaireSpace.propositions.statusAccepted",
    className:
      "bg-emerald-500/10 text-emerald-800 border-emerald-500/20 dark:text-emerald-300",
    cardAccent: "border-emerald-500/20 bg-card",
  },
  refusee: {
    labelKey: "stagiaireSpace.propositions.statusRefused",
    className: "bg-destructive/10 text-destructive border-destructive/20",
    cardAccent: "border-border bg-card opacity-90",
  },
  expiree: {
    labelKey: "stagiaireSpace.propositions.statusExpired",
    className: "bg-muted text-muted-foreground border-border",
    cardAccent: "border-border bg-muted/30 opacity-80",
  },
  annulee: {
    labelKey: "stagiaireSpace.propositions.statusCancelled",
    className: "bg-muted text-muted-foreground border-border",
    cardAccent: "border-border bg-muted/30 opacity-80",
  },
};

export const FILTERS = [
  { id: "toutes", labelKey: "stagiaireSpace.propositions.filterAll" },
  { id: "action", labelKey: "stagiaireSpace.propositions.filterPending" },
  { id: "acceptee", labelKey: "stagiaireSpace.propositions.filterAccepted" },
  { id: "refusee", labelKey: "stagiaireSpace.propositions.filterRefused" },
  { id: "expiree", labelKey: "stagiaireSpace.propositions.filterExpired" },
];

export function canRespond(statut) {
  return statut === "envoyee" || statut === "vue";
}

export function formatDate(d, locale = "fr") {
  if (!d) return null;
  const loc = locale === "en" ? "en-GB" : "fr-FR";
  return new Date(d).toLocaleDateString(loc, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/** @param {(key: string, params?: object) => string} t */
export function relativeTime(d, t, locale = "fr") {
  if (!d) return null;
  const date = new Date(d);
  const now = new Date();
  const diffMs = now - date;
  const days = Math.floor(diffMs / 86400000);
  if (days < 0) return formatDate(d, locale);
  if (days === 0) return t("stagiaireSpace.propositions.receivedToday");
  if (days === 1) return t("stagiaireSpace.propositions.receivedYesterday");
  if (days < 7) return t("stagiaireSpace.propositions.receivedDays", { count: days });
  if (days < 30) {
    const w = Math.floor(days / 7);
    return t("stagiaireSpace.propositions.receivedWeeks", { count: w });
  }
  return t("stagiaireSpace.propositions.receivedOn", { date: formatDate(d, locale) });
}

export function locationLabel(prop) {
  return [prop?.villeEntreprise, prop?.paysEntreprise].filter(Boolean).join(", ");
}

export function countByFilter(list) {
  const arr = Array.isArray(list) ? list : [];
  return {
    toutes: arr.length,
    action: arr.filter((p) => canRespond(p.statut)).length,
    acceptee: arr.filter((p) => p.statut === "acceptee").length,
    refusee: arr.filter((p) => p.statut === "refusee").length,
    expiree: arr.filter((p) => p.statut === "expiree").length,
  };
}

export function filterList(list, filterId) {
  const arr = Array.isArray(list) ? list : [];
  if (!filterId || filterId === "toutes") return arr;
  if (filterId === "action") return arr.filter((p) => canRespond(p.statut));
  return arr.filter((p) => p.statut === filterId);
}
