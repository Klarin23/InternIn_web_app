export const STATUT_LABEL_KEYS = {
  envoyee: {
    labelKey: "talents.status.pending",
    className:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  },
  vue: {
    labelKey: "talents.status.viewed",
    className:
      "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  },
  acceptee: {
    labelKey: "talents.status.accepted",
    className:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  refusee: {
    labelKey: "talents.status.rejected",
    className: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  },
  expiree: {
    labelKey: "talents.status.expired",
    className: "bg-muted text-muted-foreground",
  },
  annulee: {
    labelKey: "talents.status.cancelled",
    className: "bg-muted text-muted-foreground",
  },
};

/** Alias — prefer labelKey + t() at render time */
export const STATUT_LABELS = STATUT_LABEL_KEYS;

export const DISPONIBILITE_LABEL_KEYS = {
  disponible: {
    labelKey: "talents.status.available",
    className:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  en_processus: {
    labelKey: "talents.status.inProcess",
    className:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  },
  actif: {
    labelKey: "talents.status.inInternship",
    className:
      "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  },
  termine: {
    labelKey: "talents.status.internshipDone",
    className: "bg-muted text-muted-foreground",
  },
};

export const DISPONIBILITE_LABELS = DISPONIBILITE_LABEL_KEYS;

export function estSupprimable(statut) {
  return statut === "envoyee" || statut === "vue";
}

export function getInitials(prenom, nom) {
  return (
    `${(prenom || "").charAt(0)}${(nom || "").charAt(0)}`.toUpperCase() || "?"
  );
}

export function localization(talent) {
  const parts = [talent?.ville, talent?.pays].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

export function formatFormation(form) {
  if (!form) return null;
  const title =
    form.diplome ||
    form.departement ||
    form.faculte ||
    form.intitule ||
    form.nomFormation ||
    null;
  const school = form.nomUniversite || form.etablissement || null;
  const level =
    form.anneeEtude != null ? form.anneeEtude : null;
  return { title, school, level };
}
