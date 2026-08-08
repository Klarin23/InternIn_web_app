// Labels/couleurs d'affichage, dupliqués côté front comme le reste du
// projet (cf. CandidatureRow.jsx) — la liste réelle des permissions par rôle
// vient de l'API (/equipe/catalogue) pour rester la source de vérité.

export const ROLE_LABELS = {
  administrateur_principal: "Administrateur principal",
  gestionnaire_recrutement: "Gestionnaire recrutement",
  superviseur: "Superviseur",
  lecture_seule: "Lecture seule",
};

export const ROLES_INVITABLES = [
  { value: "gestionnaire_recrutement", label: "Gestionnaire recrutement" },
  { value: "superviseur", label: "Superviseur" },
  { value: "lecture_seule", label: "Lecture seule" },
];

export const STATUT_MEMBRE_LABELS = {
  invite: "Invitation en attente",
  actif: "Actif",
  desactive: "Désactivé",
};

export const STATUT_MEMBRE_COLORS = {
  invite: "bg-accent/40 text-amber-700",
  actif: "bg-success/10 text-green-700",
  desactive: "bg-muted text-muted-foreground",
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
