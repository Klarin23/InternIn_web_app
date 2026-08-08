// Catalogue des permissions du menu Équipe. Chaque clé correspond à une
// fonctionnalité de l'espace Entreprise que l'on peut accorder/retirer à un
// membre. "administrateur_principal" n'est jamais restreint (accès complet
// implicite) — il n'a donc pas d'entrée dans PERMISSIONS_PAR_DEFAUT_ROLE.

export const PERMISSIONS_DISPONIBLES = [
  { cle: "offres.gerer", label: "Gérer les offres de stage" },
  { cle: "candidats.gerer", label: "Gérer les candidatures" },
  { cle: "entretiens.gerer", label: "Gérer les entretiens" },
  { cle: "stagiaires.suivre", label: "Suivre les stagiaires en poste" },
  { cle: "partenariats.gerer", label: "Gérer les partenariats universités" },
  { cle: "equipe.gerer", label: "Gérer l'équipe et les permissions" },
  { cle: "parametres.gerer", label: "Gérer les paramètres de l'entreprise" },
];

export const CLES_PERMISSIONS = PERMISSIONS_DISPONIBLES.map((p) => p.cle);

export const ROLES_EQUIPE = [
  {
    valeur: "administrateur_principal",
    label: "Administrateur principal",
    description: "Accès complet à toutes les fonctionnalités. Non modifiable.",
  },
  {
    valeur: "gestionnaire_recrutement",
    label: "Gestionnaire recrutement",
    description: "Gère les offres, candidatures et entretiens.",
  },
  {
    valeur: "superviseur",
    label: "Superviseur",
    description: "Encadre des stagiaires affectés et suit leurs entretiens.",
  },
  {
    valeur: "lecture_seule",
    label: "Lecture seule",
    description: "Consultation uniquement, aucune action.",
  },
];

// Permissions accordées par défaut à un rôle tant qu'aucune permission
// personnalisée n'a été définie pour le membre.
export const PERMISSIONS_PAR_DEFAUT_ROLE = {
  gestionnaire_recrutement: [
    "offres.gerer",
    "candidats.gerer",
    "entretiens.gerer",
  ],
  superviseur: ["stagiaires.suivre", "entretiens.gerer"],
  lecture_seule: [],
};

export const EXPIRATION_INVITATION_JOURS_DEFAUT = 7;
