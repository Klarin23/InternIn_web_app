// Valeurs techniques stables — les labels passent par i18n (equipe.roles.* / equipe.status.*)

export const ROLE_LABEL_KEYS = {
  administrateur_principal: "equipe.roles.administrateur_principal",
  gestionnaire_recrutement: "equipe.roles.gestionnaire_recrutement",
  superviseur: "equipe.roles.superviseur",
  lecture_seule: "equipe.roles.lecture_seule",
};

export const ROLE_DESCRIPTION_KEYS = {
  gestionnaire_recrutement: "equipe.roleDescriptions.gestionnaire_recrutement",
  superviseur: "equipe.roleDescriptions.superviseur",
  lecture_seule: "equipe.roleDescriptions.lecture_seule",
};

/** @deprecated use ROLE_LABEL_KEYS + t() */
export const ROLE_LABELS = {
  administrateur_principal: "Administrateur principal",
  gestionnaire_recrutement: "Gestionnaire recrutement",
  superviseur: "Superviseur",
  lecture_seule: "Lecture seule",
};

/** @deprecated use ROLE_DESCRIPTION_KEYS + t() */
export const ROLE_DESCRIPTIONS = {
  gestionnaire_recrutement:
    "Accès avancé à la gestion des offres et candidatures.",
  superviseur: "Suivi des stagiaires et des stages en cours.",
  lecture_seule: "Consultation uniquement, sans modification.",
};

export const ROLES_INVITABLES = [
  {
    value: "gestionnaire_recrutement",
    labelKey: "equipe.roles.gestionnaire_recrutement",
    descriptionKey: "equipe.roleDescriptions.gestionnaire_recrutement",
  },
  {
    value: "superviseur",
    labelKey: "equipe.roles.superviseur",
    descriptionKey: "equipe.roleDescriptions.superviseur",
  },
  {
    value: "lecture_seule",
    labelKey: "equipe.roles.lecture_seule",
    descriptionKey: "equipe.roleDescriptions.lecture_seule",
  },
];

export const STATUT_MEMBRE_LABEL_KEYS = {
  invite: "equipe.status.invite",
  actif: "equipe.status.actif",
  desactive: "equipe.status.desactive",
};

/** @deprecated use STATUT_MEMBRE_LABEL_KEYS + t() */
export const STATUT_MEMBRE_LABELS = {
  invite: "Invitation en attente",
  actif: "Actif",
  desactive: "Désactivé",
};

export const STATUT_MEMBRE_COLORS = {
  invite: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  actif: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  desactive: "bg-muted text-muted-foreground border-border",
};

export const STATUT_DOT_COLORS = {
  invite: "bg-amber-500",
  actif: "bg-emerald-500",
  desactive: "bg-muted-foreground/50",
};

export const ROLE_BADGE_COLORS = {
  administrateur_principal: "bg-primary/10 text-primary border-primary/20",
  gestionnaire_recrutement: "bg-violet-500/10 text-violet-700 border-violet-500/20",
  superviseur: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  lecture_seule: "bg-slate-500/10 text-slate-600 border-slate-500/20",
};

export const AVATAR_COLORS = [
  "#14B8A6",
  "#5B3DF5",
  "#F59E0B",
  "#3B82F6",
  "#EC4899",
  "#10B981",
  "#F97316",
  "#8B5CF6",
];

export const CATEGORIE_LABEL_KEYS = {
  recrutement: "equipe.categories.recrutement",
  suivi: "equipe.categories.suivi",
  partenariats: "equipe.categories.partenariats",
  administration: "equipe.categories.administration",
};

/** Translate permission label: prefer equipe.permissions.<cle>, fallback to API label */
export function permissionLabel(t, p) {
  if (!p) return "";
  const cle = (p.cle || "").replace(/\./g, "_");
  if (p.cle) {
    const key = `equipe.permissions.${p.cle.replace(/\./g, ".")}`;
    const translated = t(key);
    if (translated && translated !== key) return translated;
  }
  return p.label || p.cle || "";
}

export function roleLabel(t, role) {
  const key = ROLE_LABEL_KEYS[role];
  return key ? t(key) : role || "";
}

export function statutLabel(t, statut) {
  const key = STATUT_MEMBRE_LABEL_KEYS[statut];
  return key ? t(key) : statut || "";
}

export function categorieLabel(t, cat) {
  if (!cat) return "";
  const norm = String(cat).toLowerCase();
  const key = CATEGORIE_LABEL_KEYS[norm];
  return key ? t(key) : cat;
}
