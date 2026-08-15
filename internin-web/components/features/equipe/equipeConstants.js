// Labels/couleurs d'affichage, dupliqués côté front comme le reste du
// projet (cf. CandidatureRow.jsx) — la liste réelle des permissions par rôle
// vient de l'API (/equipe/catalogue) pour rester la source de vérité.

export const ROLE_LABELS = {
  administrateur_principal: "Administrateur principal",
  gestionnaire_recrutement: "Gestionnaire recrutement",
  superviseur: "Superviseur",
  lecture_seule: "Lecture seule",
};

export const ROLE_DESCRIPTIONS = {
  gestionnaire_recrutement:
    "Accès avancé à la gestion des offres et candidatures.",
  superviseur: "Suivi des stagiaires et des stages en cours.",
  lecture_seule: "Consultation uniquement, sans modification.",
};

export const ROLES_INVITABLES = [
  {
    value: "gestionnaire_recrutement",
    label: "Gestionnaire recrutement",
    description: ROLE_DESCRIPTIONS.gestionnaire_recrutement,
  },
  {
    value: "superviseur",
    label: "Superviseur",
    description: ROLE_DESCRIPTIONS.superviseur,
  },
  {
    value: "lecture_seule",
    label: "Lecture seule",
    description: ROLE_DESCRIPTIONS.lecture_seule,
  },
];

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
