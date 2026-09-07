// Catalogue des permissions du menu Équipe. Chaque clé correspond à une
// fonctionnalité de l'espace Entreprise que l'on peut accorder/retirer à un
// membre. "administrateur_principal" n'est jamais restreint (accès complet
// implicite) — il n'a donc pas d'entrée dans PERMISSIONS_PAR_DEFAUT_ROLE.

export const PERMISSIONS_DISPONIBLES = [
  // Recrutement
  { cle: "offres.gerer", label: "Gérer les offres de stage", categorie: "recrutement" },
  { cle: "candidats.gerer", label: "Gérer les candidatures", categorie: "recrutement" },
  { cle: "entretiens.gerer", label: "Gérer les entretiens", categorie: "recrutement" },
  { cle: "talents.voir", label: "Voir les talents", categorie: "recrutement" },
  { cle: "talents.proposer", label: "Envoyer des propositions", categorie: "recrutement" },
  // Suivi
  { cle: "stagiaires.suivre", label: "Suivre les stagiaires en poste", categorie: "suivi" },
  { cle: "stagiaires.evaluer", label: "Évaluer les stagiaires", categorie: "suivi" },
  { cle: "stagiaires.terminer", label: "Clôturer les stages", categorie: "suivi" },
  { cle: "conventions.voir", label: "Consulter les conventions de stage", categorie: "suivi" },
  { cle: "conventions.gerer", label: "Gérer et signer les conventions", categorie: "suivi" },
  // Partenariats
  { cle: "partenariats.gerer", label: "Gérer les partenariats universités", categorie: "partenariats" },
  // Administration
  { cle: "equipe.gerer", label: "Gérer l'équipe et les permissions", categorie: "administration" },
  { cle: "parametres.gerer", label: "Gérer les paramètres de l'entreprise", categorie: "administration" },
];

export const CLES_PERMISSIONS = PERMISSIONS_DISPONIBLES.map((p) => p.cle);

export const CATEGORIES_PERMISSIONS = [
  { id: "recrutement", label: "Recrutement" },
  { id: "suivi", label: "Suivi" },
  { id: "partenariats", label: "Partenariats" },
  { id: "administration", label: "Administration" },
];

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
    "talents.voir",
    "talents.proposer",
    "conventions.voir",
    "conventions.gerer",
  ],
  superviseur: [
    "stagiaires.suivre",
    "stagiaires.evaluer",
    "entretiens.gerer",
    "conventions.voir",
  ],
  lecture_seule: ["conventions.voir"],
};

export const EXPIRATION_INVITATION_JOURS_DEFAUT = 7;
