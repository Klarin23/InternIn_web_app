// =====================================================================
// SCHÉMA DE BASE DE DONNÉES — InternIn
// Transcription complète du Schéma BDD (37 tables, 9 modules) en Drizzle ORM.
// Conventions : tous les id en UUID, date_creation/date_maj en timestamp,
// noms de colonnes en snake_case (2e argument de chaque champ).
// =====================================================================

import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  smallint,
  integer,
  numeric,
  date,
  time,
  serial,
  primaryKey,
  unique,
  uniqueIndex,
  jsonb,
} from "drizzle-orm/pg-core";

// =====================================================================
// ENUMS — regroupés en un seul bloc pour éviter les doublons de type
// =====================================================================

export const typeUtilisateurEnum = pgEnum("type_utilisateur", [
  "stagiaire",
  "entreprise",
  "universite",
  "administrateur",
  // Compte de connexion d'un membre invité via le menu Équipe (cf.
  // membresEquipe). Le rôle précis (superviseur, gestionnaire...) vit dans
  // membresEquipe.roleEquipe, pas ici — ce type ne fait que permettre la
  // connexion et le routage vers le bon espace.
  "membre_entreprise",
]);
export const methodeConnexionEnum = pgEnum("methode_connexion", [
  "email",
  "google",
]);

export const modeEntretienEnum = pgEnum("mode_entretien", [
  "video",
  "telephone",
  "presentiel",
]);

export const statutCompteEnum = pgEnum("statut_compte", [
  "inactif",
  "actif",
  "suspendu",
]);

export const typeVerificationEnum = pgEnum("type_verification", [
  "verification_email",
  "reinitialisation_mdp",
]);
export const statutVerificationTokenEnum = pgEnum("statut_verification_token", [
  "en_attente",
  "utilise",
  "expire",
]);

export const statutAcademiqueEnum = pgEnum("statut_academique", [
  "etudiant",
  "jeune_diplome",
]);
export const dureeStageEnum = pgEnum("duree_stage", [
  "1_mois",
  "2_mois",
  "3_mois",
]);
export const statutStageStagiaireEnum = pgEnum("statut_stage_stagiaire", [
  "disponible",
  "en_processus",
  "actif",
  "termine",
]);
export const typeFormationEnum = pgEnum("type_formation", [
  "en_cours",
  "obtenue",
]);
export const jourSemaineEnum = pgEnum("jour_semaine", [
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
  "dimanche",
]);
export const typeDocumentEnum = pgEnum("type_document", [
  "cv",
  "registre_commerce",
  "certificat_constitution",
  "justificatif_entreprise",
  "accreditation_universite",
  "enregistrement_officiel",
  "autorisation_administrative",
  "autre",
]);

export const typeCompetenceEnum = pgEnum("type_competence", [
  "technique",
  "professionnelle",
  "langue",
]);
export const niveauCompetenceEnum = pgEnum("niveau_competence", [
  "debutant",
  "intermediaire",
  "avance",
]);

export const tailleEntrepriseEnum = pgEnum("taille_entreprise", [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "500+",
]);
// Réutilisé par entreprises ET universites (mêmes valeurs)
export const statutVerificationEnum = pgEnum("statut_verification", [
  "en_attente",
  "verifiee",
  "rejetee",
]);

export const statutPartenariatEnum = pgEnum("statut_partenariat", [
  "en_attente",
  "acceptee",
  "refusee",
]);

export const roleAdminEnum = pgEnum("role_admin", [
  "super_admin",
  "operations",
  "support",
  "relations_entreprises",
  "relations_universites",
  "conformite",
]);
export const statutLitigeEnum = pgEnum("statut_litige", [
  "ouvert",
  "en_cours",
  "resolu",
  "rejete",
]);

// Rôles de l'espace "Équipe" côté entreprise (menu Équipe). Un seul membre
// par entreprise porte estAdminPrincipal=true (le créateur du compte) ; les
// autres rôles définissent un jeu de permissions PAR DÉFAUT, éventuellement
// affiné par membre via membresEquipe.permissionsPersonnalisees.
export const roleEquipeEnum = pgEnum("role_equipe", [
  "administrateur_principal",
  "gestionnaire_recrutement",
  "superviseur",
  "lecture_seule",
]);

export const rolePersonnelUniversiteEnum = pgEnum("role_personnel_universite", [
  "conseiller_carriere",
  "coordinateur_pedagogique",
  "coordinateur_stage",
]);
export const statutInvitationEnum = pgEnum("statut_invitation", [
  "invite",
  "actif",
  "desactive",
]);

export const modeTravailEnum = pgEnum("mode_travail", [
  "distance",
  "hybride",
  "presentiel",
]);
export const remunerationTypeEnum = pgEnum("remuneration_type", [
  "aucune",
  "indemnite_transport",
  "indemnite_repas",
  "allocation_mensuelle",
  // Pour les stages à distance : indemnise les frais d'accès internet /
  // forfait téléphonique du stagiaire plutôt que le transport (sans objet
  // à distance).
  "indemnite_internet_appel",
]);
export const statutOffreStageEnum = pgEnum("statut_offre_stage", [
  "brouillon",
  "publie",
  "pause",
  "ferme",
  "archive",
]);

export const origineCandidatureEnum = pgEnum("origine_candidature", [
  "candidature_spontanee",
  "invitation_entreprise",
]);
export const statutCandidatureEnum = pgEnum("statut_candidature", [
  "soumise",
  "consultee",
  "preselectionnee",
  "rejetee",
  "retiree",
  "acceptee",
]);

export const statutPropositionStageEnum = pgEnum("statut_proposition_stage", [
  "envoyee",
  "vue",
  "acceptee",
  "refusee",
  "expiree",
  "annulee",
]);

export const statutEntretienEnum = pgEnum("statut_entretien", [
  "planifie", "valide", "confirme", "reprogramme", "termine", "annule", "absent",
]);

export const statutValidationPlateformeEnum = pgEnum(
  "statut_validation_plateforme",
  ["en_attente", "approuve", "renvoye_modification", "rejete"],
);
export const statutReponseStagiaireEnum = pgEnum("statut_reponse_stagiaire", [
  "en_attente",
  "acceptee",
  "refusee",
]);

export const statutStageEnum = pgEnum("statut_stage", [
  "a_venir",
  "actif",
  "termine",
  "interrompu",
]);

// Suivi de progression du stage (espace Superviseur, section "Suivi de
// progression") — objectifs et tâches sont deux listes distinctes que le
// stagiaire et/ou le superviseur peuvent faire évoluer au fil du stage.
export const statutObjectifStageEnum = pgEnum("statut_objectif_stage", [
  "defini",
  "realise",
]);
export const statutTacheStageEnum = pgEnum("statut_tache_stage", [
  "a_faire",
  "terminee",
]);

// Journal de stage (espace Superviseur, section "Journal de stage /
// activités") — le stagiaire enregistre une entrée, le superviseur la fait
// évoluer via ce statut.
export const statutJournalStageEnum = pgEnum("statut_journal_stage", [
  "en_attente",
  "validee",
  "correction_demandee",
  "terminee",
]);

export const statutEvaluationEnum = pgEnum("statut_evaluation", [
  "en_attente",
  "soumise",
  "en_retard",
]);

export const typeRessourceEnum = pgEnum("type_ressource", [
  "article",
  "question_reflexion",
  "scenario_professionnel",
  "modele_communication",
  "checklist",
  "exemple_email",
  "guide_reunion",
]);

export const canalNotificationEnum = pgEnum("canal_notification", [
  "in_app",
  "email",
]);
export const statutLectureNotifEnum = pgEnum("statut_lecture_notif", [
  "non_lue",
  "lue",
]);
export const statutConversationEnum = pgEnum("statut_conversation", [
  "active",
  "archivee",
]);
export const typeConversationEnum = pgEnum("type_conversation", [
  "entreprise",
  "superviseur",
]);
export const statutLectureMessageEnum = pgEnum("statut_lecture_message", [
  "envoye",
  "lu",
]);

// =====================================================================
// MODULE 1 — Comptes et Authentification
// =====================================================================

export const utilisateurs = pgTable("utilisateurs", {
  idUtilisateur: uuid("id_utilisateur").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  motDePasseHash: varchar("mot_de_passe_hash", { length: 255 }),
  typeUtilisateur: typeUtilisateurEnum("type_utilisateur").notNull(),
  methodeConnexion: methodeConnexionEnum("methode_connexion")
    .notNull()
    .default("email"),
  emailVerifie: boolean("email_verifie").default(false),
  statutCompte: statutCompteEnum("statut_compte").notNull().default("inactif"),
  derniereConnexion: timestamp("derniere_connexion", { withTimezone: true }),
  versionJeton: integer("version_jeton").notNull().default(0),
  dateCreation: timestamp("date_creation", { withTimezone: true }).defaultNow(),
  dateMaj: timestamp("date_maj", { withTimezone: true }).defaultNow(),
});

export const sessionsUtilisateur = pgTable("sessions_utilisateur", {
  idSession: uuid("id_session").defaultRandom().primaryKey(),
  idUtilisateur: uuid("id_utilisateur")
    .notNull()
    .references(() => utilisateurs.idUtilisateur),
  jeton: varchar("jeton", { length: 512 }).notNull(),
  adresseIp: varchar("adresse_ip", { length: 45 }),
  paysConnexion: varchar("pays_connexion", { length: 100 }),
  villeConnexion: varchar("ville_connexion", { length: 100 }),
  dateExpiration: timestamp("date_expiration", { withTimezone: true }).notNull(),
  dateCreation: timestamp("date_creation", { withTimezone: true }).defaultNow(),
});

/**
 * Tentatives de connexion échouées — alimente le module d'activité suspecte.
 * Conservées pour analyse admin (fenêtre glissante 24h / 7j).
 */
export const tentativesConnexion = pgTable("tentatives_connexion", {
  idTentative: uuid("id_tentative").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  idUtilisateur: uuid("id_utilisateur").references(() => utilisateurs.idUtilisateur),
  adresseIp: varchar("adresse_ip", { length: 45 }),
  motif: varchar("motif", { length: 80 }).notNull().default("identifiants_invalides"),
  dateCreation: timestamp("date_creation", { withTimezone: true }).defaultNow(),
});

export const sseTickets = pgTable("sse_tickets", {
  idTicket: uuid("id_ticket").defaultRandom().primaryKey(),
  idUtilisateur: uuid("id_utilisateur")
    .notNull()
    .references(() => utilisateurs.idUtilisateur, { onDelete: "cascade" }),
  ticketHash: varchar("ticket_hash", { length: 64 }).notNull().unique(),
  dateExpiration: timestamp("date_expiration", { withTimezone: true }).notNull(),
  dateUtilisation: timestamp("date_utilisation", { withTimezone: true }),
  dateCreation: timestamp("date_creation", { withTimezone: true }).defaultNow(),
});

export const verificationsEmail = pgTable("verifications_email", {
  idVerification: uuid("id_verification").defaultRandom().primaryKey(),
  idUtilisateur: uuid("id_utilisateur")
    .notNull()
    .references(() => utilisateurs.idUtilisateur),
  type: typeVerificationEnum("type").notNull(),
  codeJeton: varchar("code_jeton", { length: 255 }).notNull(),
  statut: statutVerificationTokenEnum("statut").notNull().default("en_attente"),
  dateExpiration: timestamp("date_expiration", { withTimezone: true }).notNull(),
});

// =====================================================================
// MODULE 2 — Profil Stagiaire
// =====================================================================

export const stagiaires = pgTable("stagiaires", {
  idStagiaire: uuid("id_stagiaire").defaultRandom().primaryKey(),
  idUtilisateur: uuid("id_utilisateur")
    .notNull()
    .unique()
    .references(() => utilisateurs.idUtilisateur),
  prenom: varchar("prenom", { length: 100 }).notNull(),
  nom: varchar("nom", { length: 100 }).notNull(),
  photoProfilUrl: text("photo_profil_url"),
  telephone: varchar("telephone", { length: 30 }).notNull(),
  pays: varchar("pays", { length: 100 }).notNull(),
  ville: varchar("ville", { length: 100 }).notNull(),
  dateNaissance: date("date_naissance"),
  statutAcademique: statutAcademiqueEnum("statut_academique"),
  cvUrl: text("cv_url").notNull(),
  linkedinUrl: text("linkedin_url"),
  githubUrl: text("github_url"),
  behanceUrl: text("behance_url"),
  portfolioUrl: text("portfolio_url"),
  siteWebUrl: text("site_web_url"),
  dureeStageSouhaitee: dureeStageEnum("duree_stage_souhaitee"),
  heuresHebdoSouhaitees: smallint("heures_hebdo_souhaitees"), // 15 à 40, contrôlé côté applicatif
  dateDebutSouhaitee: date("date_debut_souhaitee"),
  scoreCompletudeProfil: smallint("score_completude_profil").default(0), // 0-100
  // Visibilité du profil auprès des entreprises (fonctionnalité Talents)
  profilVisibleEntreprises: boolean("profil_visible_entreprises").notNull().default(false),
  statutStage: statutStageStagiaireEnum("statut_stage").default("disponible"),
  idUniversite: uuid("id_universite").references(
    () => universites.idUniversite,
  ),

  // --- Profil professionnel (page "Mon profil") ---
  titreProfessionnel: varchar("titre_professionnel", { length: 150 }),
  presentation: text("presentation"),
  objectifProfessionnel: text("objectif_professionnel"),

  // --- Préférences de recherche ---
  secteursRecherches: text("secteurs_recherches").array(),
  villesRecherchees: text("villes_recherchees").array(),
  modalitesTravailSouhaitees: text("modalites_travail_souhaitees").array(), // "presentiel" | "hybride" | "distance"
  remunerationSouhaitee: remunerationTypeEnum("remuneration_souhaitee"),
  
  dateCreation: timestamp("date_creation", { withTimezone: true }).defaultNow(),
});

export const formations = pgTable("formations", {
  idFormation: uuid("id_formation").defaultRandom().primaryKey(),
  idStagiaire: uuid("id_stagiaire")
    .notNull()
    .references(() => stagiaires.idStagiaire),
  typeFormation: typeFormationEnum("type_formation").notNull(),
  nomUniversite: varchar("nom_universite", { length: 255 }).notNull(),
  faculte: varchar("faculte", { length: 255 }),
  departement: varchar("departement", { length: 255 }),
  diplome: varchar("diplome", { length: 255 }).notNull(),
  anneeEtude: smallint("annee_etude"),
  anneeObtention: smallint("annee_obtention"),
});

export const disponibilitesStagiaire = pgTable("disponibilites_stagiaire", {
  idDisponibilite: uuid("id_disponibilite").defaultRandom().primaryKey(),
  idStagiaire: uuid("id_stagiaire")
    .notNull()
    .references(() => stagiaires.idStagiaire),
  jourSemaine: jourSemaineEnum("jour_semaine").notNull(),
  heureDebut: time("heure_debut"),
  heureFin: time("heure_fin"),
});

export const documents = pgTable("documents", {
  idDocument: uuid("id_document").defaultRandom().primaryKey(),
  idUtilisateur: uuid("id_utilisateur")
    .notNull()
    .references(() => utilisateurs.idUtilisateur),
  typeDocument: typeDocumentEnum("type_document").notNull(),
  urlFichier: text("url_fichier").notNull(),
  nomFichier: varchar("nom_fichier", { length: 255 }),
  dateUpload: timestamp("date_upload", { withTimezone: true }).defaultNow(),
});

// =====================================================================
// MODULE 3 — Référentiels et Compétences
// =====================================================================

export const competences = pgTable("competences", {
  idCompetence: uuid("id_competence").defaultRandom().primaryKey(),
  nom: varchar("nom", { length: 150 }).notNull(),
  typeCompetence: typeCompetenceEnum("type_competence").notNull(),
});

export const stagiaireCompetences = pgTable(
  "stagiaire_competences",
  {
    idStagiaire: uuid("id_stagiaire")
      .notNull()
      .references(() => stagiaires.idStagiaire),
    idCompetence: uuid("id_competence")
      .notNull()
      .references(() => competences.idCompetence),
    niveau: niveauCompetenceEnum("niveau"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.idStagiaire, t.idCompetence] }),
  }),
);

export const centresInteret = pgTable("centres_interet", {
  idCentreInteret: uuid("id_centre_interet").defaultRandom().primaryKey(),
  nom: varchar("nom", { length: 150 }).notNull().unique(),
});

export const stagiaireCentresInteret = pgTable(
  "stagiaire_centres_interet",
  {
    idStagiaire: uuid("id_stagiaire")
      .notNull()
      .references(() => stagiaires.idStagiaire),
    idCentreInteret: uuid("id_centre_interet")
      .notNull()
      .references(() => centresInteret.idCentreInteret),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.idStagiaire, t.idCentreInteret] }),
  }),
);

export const objectifsDeveloppement = pgTable("objectifs_developpement", {
  idObjectif: uuid("id_objectif").defaultRandom().primaryKey(),
  nom: varchar("nom", { length: 150 }).notNull().unique(),
});

export const stagiaireObjectifsDeveloppement = pgTable(
  "stagiaire_objectifs_developpement",
  {
    idStagiaire: uuid("id_stagiaire")
      .notNull()
      .references(() => stagiaires.idStagiaire),
    idObjectif: uuid("id_objectif")
      .notNull()
      .references(() => objectifsDeveloppement.idObjectif),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.idStagiaire, t.idObjectif] }),
  }),
);

// =====================================================================
// MODULE 4 — Entreprises
// =====================================================================

export const entreprises = pgTable("entreprises", {
  idEntreprise: uuid("id_entreprise").defaultRandom().primaryKey(),
  idUtilisateur: uuid("id_utilisateur")
    .notNull()
    .unique()
    .references(() => utilisateurs.idUtilisateur),
  nomEntreprise: varchar("nom_entreprise", { length: 255 }).notNull(),
  logoUrl: text("logo_url"),
  secteurActivite: varchar("secteur_activite", { length: 150 }),
  tailleEntreprise: tailleEntrepriseEnum("taille_entreprise"),
  siteWeb: text("site_web"),
  linkedinUrl: text("linkedin_url"),
  pays: varchar("pays", { length: 100 }),
  ville: varchar("ville", { length: 100 }),
  adresse: text("adresse"),
  aPropos: text("a_propos"),
  mission: text("mission"),
  cultureEntreprise: text("culture_entreprise"),
  statutVerification: statutVerificationEnum("statut_verification").default(
    "en_attente",
  ),
  dateVerification: timestamp("date_verification", { withTimezone: true }),
  adminVerificateurId: uuid("admin_verificateur_id").references(
    () => administrateurs.idAdmin,
  ),
  motifRejetVerification: text("motif_rejet_verification"),
  dateCreation: timestamp("date_creation", { withTimezone: true }).defaultNow(),
});

export const contactsEntreprise = pgTable("contacts_entreprise", {
  idContact: uuid("id_contact").defaultRandom().primaryKey(),
  idEntreprise: uuid("id_entreprise")
    .notNull()
    .references(() => entreprises.idEntreprise),
  nom: varchar("nom", { length: 150 }).notNull(),
  fonction: varchar("fonction", { length: 150 }),
  email: varchar("email", { length: 255 }),
  telephone: varchar("telephone", { length: 30 }),
  estContactPrincipal: boolean("est_contact_principal").default(false),
  peutEtreSuperviseur: boolean("peut_etre_superviseur").default(true),
});

// =====================================================================
// MODULE 4bis — Équipe Entreprise (menu "Équipe" de l'espace Entreprise)
// =====================================================================

// Un membre existe dès l'invitation (statutMembre="invite", idUtilisateur
// encore null) ; idUtilisateur n'est renseigné qu'une fois l'invitation
// acceptée et le compte de connexion créé. Le compte propriétaire de
// l'entreprise (celui qui s'est inscrit) est représenté ici par la ligne
// estAdminPrincipal=true, créée automatiquement au premier accès au menu.
export const membresEquipe = pgTable("membres_equipe", {
  idMembre: uuid("id_membre").defaultRandom().primaryKey(),
  idEntreprise: uuid("id_entreprise")
    .notNull()
    .references(() => entreprises.idEntreprise),
  idUtilisateur: uuid("id_utilisateur")
    .unique()
    .references(() => utilisateurs.idUtilisateur),
  nom: varchar("nom", { length: 150 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  roleEquipe: roleEquipeEnum("role_equipe").notNull().default("lecture_seule"),
  // Tableau de clés de permission (ex: ["offres.gerer", "candidats.gerer"]).
  // null = le membre hérite simplement des permissions par défaut de son rôle.
  permissionsPersonnalisees: jsonb("permissions_personnalisees"),
  estAdminPrincipal: boolean("est_admin_principal").default(false),
  statutMembre: statutInvitationEnum("statut_membre").notNull().default("invite"),
  tokenInvitation: varchar("token_invitation", { length: 255 }),
  dateEnvoiInvitation: timestamp("date_envoi_invitation", { withTimezone: true }).defaultNow(),
  dateExpirationInvitation: timestamp("date_expiration_invitation", { withTimezone: true }),
  nombreRenvoisInvitation: smallint("nombre_renvois_invitation").default(0),
  dateActivation: timestamp("date_activation", { withTimezone: true }),
  dateDesactivation: timestamp("date_desactivation", { withTimezone: true }),
  dateCreation: timestamp("date_creation", { withTimezone: true }).defaultNow(),
});

// Affectation d'un stage actif à un membre de l'équipe responsable de son
// encadrement. Distincte du idContactSuperviseur choisi à la création de
// l'offre (contactsEntreprise) : celle-ci peut être réassignée à tout moment
// pendant le stage, à un membre disposant réellement d'un accès InternIn.
export const affectationsSuperviseurStage = pgTable(
  "affectations_superviseur_stage",
  {
    idAffectation: uuid("id_affectation").defaultRandom().primaryKey(),
    idStage: uuid("id_stage")
      .notNull()
      .unique()
      .references(() => stages.idStage),
    idMembre: uuid("id_membre")
      .notNull()
      .references(() => membresEquipe.idMembre),
    dateAffectation: timestamp("date_affectation", { withTimezone: true }).defaultNow(),
  },
);

// Journal d'activité de l'équipe — une ligne par action importante
// (invitation, changement de rôle, activation/désactivation, affectation...).
export const activitesEquipe = pgTable("activites_equipe", {
  idActivite: uuid("id_activite").defaultRandom().primaryKey(),
  idEntreprise: uuid("id_entreprise")
    .notNull()
    .references(() => entreprises.idEntreprise),
  idMembre: uuid("id_membre").references(() => membresEquipe.idMembre),
  idCandidature: uuid("id_candidature").references(
    () => candidatures.idCandidature,
  ),
  action: varchar("action", { length: 255 }).notNull(),
  details: text("details"),
  dateAction: timestamp("date_action", { withTimezone: true }).defaultNow(),
});

// Une seule évaluation "vivante" par candidature — n'importe quel membre
// de l'équipe peut la mettre à jour (note collective, pas un vote par
// personne). dateMaj + idMembreMaj indiquent qui l'a modifiée en dernier.
export const evaluationsCandidature = pgTable("evaluations_candidature", {
  idCandidature: uuid("id_candidature")
    .primaryKey()
    .references(() => candidatures.idCandidature),
  noteGlobale: smallint("note_globale"), // 1 à 5, l'étoile globale
  motivation: smallint("motivation"), // 1 à 5
  communication: smallint("communication"), // 1 à 5
  technique: smallint("technique"), // 1 à 5
  presentation: smallint("presentation"), // 1 à 5
  idMembreMaj: uuid("id_membre_maj").references(() => membresEquipe.idMembre),
  dateMaj: timestamp("date_maj", { withTimezone: true }).defaultNow(),
});

// Fil de notes internes — plusieurs notes par candidature, une par membre
// qui écrit, jamais visibles du candidat.
export const notesCandidature = pgTable("notes_candidature", {
  idNote: uuid("id_note").defaultRandom().primaryKey(),
  idCandidature: uuid("id_candidature")
    .notNull()
    .references(() => candidatures.idCandidature),
  idMembre: uuid("id_membre").references(() => membresEquipe.idMembre),
  contenu: text("contenu").notNull(),
  dateCreation: timestamp("date_creation", { withTimezone: true }).defaultNow(),
});

// Règles générales de gestion de l'équipe, une ligne par entreprise.
export const parametresEquipeEntreprise = pgTable(
  "parametres_equipe_entreprise",
  {
    idEntreprise: uuid("id_entreprise")
      .primaryKey()
      .references(() => entreprises.idEntreprise),
    roleParDefautInvitation: roleEquipeEnum("role_par_defaut_invitation")
      .notNull()
      .default("lecture_seule"),
    expirationInvitationJours: smallint("expiration_invitation_jours")
      .notNull()
      .default(7),
    approbationRequisePourInvitation: boolean(
      "approbation_requise_pour_invitation",
    ).default(false),
    notifierAdminNouvelleActivite: boolean(
      "notifier_admin_nouvelle_activite",
    ).default(true),
  },
);

// =====================================================================
// MODULE 5 — Universités
// =====================================================================

export const universites = pgTable("universites", {
  idUniversite: uuid("id_universite").defaultRandom().primaryKey(),
  idUtilisateur: uuid("id_utilisateur")
    .notNull()
    .unique()
    .references(() => utilisateurs.idUtilisateur),
  nomUniversite: varchar("nom_universite", { length: 255 }).notNull(),
  emailOfficiel: varchar("email_officiel", { length: 255 }).notNull(),
  logoUrl: text("logo_url"),
  siteWeb: text("site_web"),
  pays: varchar("pays", { length: 100 }),
  typeEtablissement: varchar("type_etablissement", { length: 150 }),
  nombreEtudiants: integer("nombre_etudiants"),
  contactServiceCarriere: varchar("contact_service_carriere", { length: 255 }),
  periodeStageHabituelle: varchar("periode_stage_habituelle", { length: 150 }),
  heuresRecommandeesSemaine: smallint("heures_recommandees_semaine"),
  nomCoordinateurStage: varchar("nom_coordinateur_stage", { length: 150 }),
  statutVerification: statutVerificationEnum("statut_verification").default(
    "en_attente",
  ),
  dateVerification: timestamp("date_verification", { withTimezone: true }),
  dateCreation: timestamp("date_creation", { withTimezone: true }).defaultNow(),
});

// Invitation de partenariat envoyée par une université à une entreprise.
// Distinct des "partenaires" auto-détectés via stages.idUniversite : ici,
// le lien existe même AVANT qu'un stage n'ait démarré, à l'initiative de
// l'université. Une entreprise qui accepte devient visible dans l'espace
// "Partenaires" des deux côtés, sans qu'aucun stage n'ait encore eu lieu.
export const partenariatsUniversiteEntreprise = pgTable(
  "partenariats_universite_entreprise",
  {
    idPartenariat: uuid("id_partenariat").defaultRandom().primaryKey(),
    idUniversite: uuid("id_universite")
      .notNull()
      .references(() => universites.idUniversite),
    idEntreprise: uuid("id_entreprise")
      .notNull()
      .references(() => entreprises.idEntreprise),
    statut: statutPartenariatEnum("statut").notNull().default("en_attente"),
    messageInvitation: text("message_invitation"),
    dateEnvoi: timestamp("date_envoi", { withTimezone: true }).defaultNow(),
    dateReponse: timestamp("date_reponse", { withTimezone: true }),
  },
  (table) => ({
    unique: unique().on(table.idUniversite, table.idEntreprise),
  }),
);

export const personnelUniversite = pgTable("personnel_universite", {
  idPersonnel: uuid("id_personnel").defaultRandom().primaryKey(),
  idUniversite: uuid("id_universite")
    .notNull()
    .references(() => universites.idUniversite),
  nom: varchar("nom", { length: 150 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  role: rolePersonnelUniversiteEnum("role").notNull(),
  statutInvitation: statutInvitationEnum("statut_invitation").default("invite"),
});

// =====================================================================
// MODULE 6 — Administration
// =====================================================================

export const administrateurs = pgTable("administrateurs", {
  idAdmin: uuid("id_admin").defaultRandom().primaryKey(),
  idUtilisateur: uuid("id_utilisateur")
    .notNull()
    .unique()
    .references(() => utilisateurs.idUtilisateur),
  nom: varchar("nom", { length: 150 }).notNull(),
  roleAdmin: roleAdminEnum("role_admin").notNull(),
});

export const litigesReclamations = pgTable("litiges_reclamations", {
  idLitige: uuid("id_litige").defaultRandom().primaryKey(),
  idStage: uuid("id_stage").references(() => stages.idStage),
  idUtilisateurPlaignant: uuid("id_utilisateur_plaignant")
    .notNull()
    .references(() => utilisateurs.idUtilisateur),
  idAdminAssigne: uuid("id_admin_assigne").references(
    () => administrateurs.idAdmin,
  ),
  typeLitige: varchar("type_litige", { length: 150 }),
  // Safety & Reporting — cible et classification (optionnels, rétrocompat)
  cibleType: varchar("cible_type", { length: 30 }), // entreprise | superviseur
  categorie: varchar("categorie", { length: 100 }),
  severite: varchar("severite", { length: 20 }), // faible | moyen | eleve | critique
  dateIncident: date("date_incident"),
  reference: varchar("reference", { length: 40 }).unique(),
  description: text("description").notNull(),
  statut: statutLitigeEnum("statut").notNull().default("ouvert"),
  dateCreation: timestamp("date_creation", { withTimezone: true }).defaultNow(),
  dateResolution: timestamp("date_resolution", { withTimezone: true }),
  escalade: boolean("escalade").notNull().default(false),
  motifEscalade: text("motif_escalade"),
  dateEscalade: timestamp("date_escalade", { withTimezone: true }),
  motifDecision: text("motif_decision"),
  attendInfo: boolean("attend_info").notNull().default(false),
});

/** Notes internes admin — jamais exposées au stagiaire */
export const litigesNotesInternes = pgTable("litiges_notes_internes", {
  idNote: uuid("id_note").defaultRandom().primaryKey(),
  idLitige: uuid("id_litige")
    .notNull()
    .references(() => litigesReclamations.idLitige, { onDelete: "cascade" }),
  idAdmin: uuid("id_admin")
    .notNull()
    .references(() => administrateurs.idAdmin),
  contenu: text("contenu").notNull(),
  dateCreation: timestamp("date_creation", { withTimezone: true }).defaultNow(),
});

/** Messages visibles stagiaire ↔ admin sur un signalement */
export const litigesMessages = pgTable("litiges_messages", {
  idMessage: uuid("id_message").defaultRandom().primaryKey(),
  idLitige: uuid("id_litige")
    .notNull()
    .references(() => litigesReclamations.idLitige, { onDelete: "cascade" }),
  idAuteur: uuid("id_auteur")
    .notNull()
    .references(() => utilisateurs.idUtilisateur),
  roleAuteur: varchar("role_auteur", { length: 30 }).notNull(),
  contenu: text("contenu").notNull(),
  dateCreation: timestamp("date_creation", { withTimezone: true }).defaultNow(),
});

/** Pièces jointes signalement (stockage privé) */
export const litigesPiecesJointes = pgTable("litiges_pieces_jointes", {
  idPiece: uuid("id_piece").defaultRandom().primaryKey(),
  idLitige: uuid("id_litige")
    .notNull()
    .references(() => litigesReclamations.idLitige, { onDelete: "cascade" }),
  idUploader: uuid("id_uploader")
    .notNull()
    .references(() => utilisateurs.idUtilisateur),
  nomOriginal: varchar("nom_original", { length: 255 }).notNull(),
  nomStockage: varchar("nom_stockage", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 120 }),
  tailleOctets: integer("taille_octets"),
  dateUpload: timestamp("date_upload", { withTimezone: true }).defaultNow(),
});

// Notifications in-app — un déclencheur métier (entretien planifié, validé,
// reprogrammé, confirmé, annulé...) crée une ligne pour le destinataire
// concerné. `lien` est un chemin relatif interne (ex: "/entretiens") vers
// lequel la cloche renvoie au clic ; peut rester vide si non pertinent.
export const notifications = pgTable("notifications", {
  idNotification: uuid("id_notification").defaultRandom().primaryKey(),
  idUtilisateur: uuid("id_utilisateur")
    .notNull()
    .references(() => utilisateurs.idUtilisateur),
  type: varchar("type", { length: 100 }).notNull(),
  titre: varchar("titre", { length: 255 }).notNull(),
  message: text("message"),
  lien: varchar("lien", { length: 255 }),
  lu: boolean("lu").notNull().default(false),
  dateCreation: timestamp("date_creation", { withTimezone: true }).defaultNow(),
});


// Préférences de notifications in-app de l'espace Entreprise (une ligne / entreprise).
// Source de vérité unique — remplace localStorage "internin-entreprise-notif-prefs".
// Catégories alignées sur l'UI Paramètres → Notifications :
//   messages | candidatures | evaluations | equipe
// Les notifications obligatoires (sécurité, compte) ne passent PAS par ces flags.
export const preferencesNotificationsEntreprise = pgTable(
  "preferences_notifications_entreprise",
  {
    idPreference: uuid("id_preference").defaultRandom().primaryKey(),
    idEntreprise: uuid("id_entreprise")
      .notNull()
      .unique()
      .references(() => entreprises.idEntreprise, { onDelete: "cascade" }),
    messages: boolean("messages").notNull().default(true),
    candidatures: boolean("candidatures").notNull().default(true),
    evaluations: boolean("evaluations").notNull().default(true),
    equipe: boolean("equipe").notNull().default(true),
    dateCreation: timestamp("date_creation", { withTimezone: true }).defaultNow(),
    dateMaj: timestamp("date_maj", { withTimezone: true }).defaultNow(),
  },
);


export const modelesEmail = pgTable("modeles_email", {
  idModele: uuid("id_modele").defaultRandom().primaryKey(),
  codeModele: varchar("code_modele", { length: 100 }).notNull().unique(),
  sujet: varchar("sujet", { length: 255 }),
  corpsHtml: text("corps_html"),
});

// Ligne unique (singleton) de configuration globale de la plateforme,
// modifiable depuis la page "Paramètres" de la console admin.
export const parametresPlateforme = pgTable("parametres_plateforme", {
  idParametres: uuid("id_parametres").defaultRandom().primaryKey(),
  validationAutomatique: boolean("validation_automatique").notNull().default(false),
  // Clés cochées dans l'admin lorsque validationAutomatique=true :
  // "offres_finales" | "conventions" | "entreprises" | "universites"
  elementsValidationAutomatique: jsonb("elements_validation_automatique")
    .notNull()
    .default([]),
  delaiTraitementHeures: integer("delai_traitement_heures").notNull().default(72),
  documentsRequisParEntite: integer("documents_requis_par_entite")
    .notNull()
    .default(3),
  notificationsEmail: boolean("notifications_email").notNull().default(true),
    doubleAuthentification: boolean("double_authentification")
    .notNull()
    .default(false),
  modeMaintenance: boolean("mode_maintenance").notNull().default(false),
  messageMaintenance: text("message_maintenance"),
  maintenanceDebut: timestamp("maintenance_debut", { withTimezone: true }),
  maintenanceFin: timestamp("maintenance_fin", { withTimezone: true }),
  adminsPeuventAcceder: boolean("admins_peuvent_acceder").notNull().default(true),
  dateMaj: timestamp("date_maj", { withTimezone: true }).defaultNow(),
});

// =====================================================================
// MODULE 7 — Cycle de Vie du Stage
// =====================================================================

export const offresStage = pgTable("offres_stage", {
  idOffre: uuid("id_offre").defaultRandom().primaryKey(),
  idEntreprise: uuid("id_entreprise")
    .notNull()
    .references(() => entreprises.idEntreprise),
  titre: varchar("titre", { length: 255 }).notNull(),
  departement: varchar("departement", { length: 150 }),
  secteurActivite: varchar("secteur_activite", { length: 150 }),
  description: text("description").notNull(),
  responsabilites: text("responsabilites"),
  competencesRequises: text("competences_requises"),
  opportunitesApprentissage: text("opportunites_apprentissage"),
  modeTravail: modeTravailEnum("mode_travail"),
  remunerationType: remunerationTypeEnum("remuneration_type"),
  montantRemuneration: numeric("montant_remuneration", {
    precision: 10,
    scale: 2,
  }),
  nombrePostes: smallint("nombre_postes").default(1),
  idContactSuperviseur: uuid("id_contact_superviseur").references(
    () => contactsEntreprise.idContact,
  ),
  statut: statutOffreStageEnum("statut").notNull().default("brouillon"),
  datePublication: timestamp("date_publication", { withTimezone: true }),
  dureeStage: dureeStageEnum("duree_stage"),
  dateLimiteCandidature: date("date_limite_candidature"),
  dateCreation: timestamp("date_creation", { withTimezone: true }).defaultNow(),
});

export const candidatures = pgTable(
  "candidatures",
  {
    idCandidature: uuid("id_candidature").defaultRandom().primaryKey(),
    idStagiaire: uuid("id_stagiaire")
      .notNull()
      .references(() => stagiaires.idStagiaire),
    idOffre: uuid("id_offre")
      .notNull()
      .references(() => offresStage.idOffre),
    origine: origineCandidatureEnum("origine").notNull(),
    statut: statutCandidatureEnum("statut").notNull().default("soumise"),
    lettreMotivation: text("lettre_motivation"),
    messageRejet: text("message_rejet"),
    dateCandidature: timestamp("date_candidature", { withTimezone: true }).defaultNow(),
    dateMajStatut: timestamp("date_maj_statut", { withTimezone: true }).defaultNow(),
    motifRetraitCode: varchar("motif_retrait_code", { length: 80 }),
    motifRetraitCommentaire: text("motif_retrait_commentaire"),
    dateRetrait: timestamp("date_retrait", { withTimezone: true }),
  },
  (t) => ({
    // Règle métier : un stagiaire ne peut candidater qu'une fois à la même offre
    uqStagiaireOffre: unique("uq_candidature_stagiaire_offre").on(
      t.idStagiaire,
      t.idOffre,
    ),
  }),
);


// =====================================================================
// Propositions de stage (entreprise → stagiaire)
// =====================================================================
export const propositionsStage = pgTable(
  "propositions_stage",
  {
    idProposition: uuid("id_proposition").defaultRandom().primaryKey(),
    idEntreprise: uuid("id_entreprise")
      .notNull()
      .references(() => entreprises.idEntreprise),
    idStagiaire: uuid("id_stagiaire")
      .notNull()
      .references(() => stagiaires.idStagiaire),
    idOffre: uuid("id_offre")
      .notNull()
      .references(() => offresStage.idOffre),
    message: text("message"),
    // Motif de refus saisi par le stagiaire (null si acceptée ou sans commentaire)
    commentaireReponse: text("commentaire_reponse"),
    statut: statutPropositionStageEnum("statut").notNull().default("envoyee"),
    dateCreation: timestamp("date_creation", { withTimezone: true }).defaultNow(),
    dateVue: timestamp("date_vue", { withTimezone: true }),
    dateReponse: timestamp("date_reponse", { withTimezone: true }),
  },
  (t) => ({
    // Empêcher les propositions en doublon pour la même offre/stagiaire
    uqEntrepriseStagiaireOffre: unique("uq_proposition_entreprise_stagiaire_offre").on(
      t.idEntreprise,
      t.idStagiaire,
      t.idOffre,
    ),
  }),
);

export const entretiens = pgTable("entretiens", {
  idEntretien: uuid("id_entretien").defaultRandom().primaryKey(),
  idCandidature: uuid("id_candidature")
    .notNull()
    .references(() => candidatures.idCandidature),
  dateHeure: timestamp("date_heure", { withTimezone: true }).notNull(),
  dateHeureProposee: timestamp("date_heure_proposee", { withTimezone: true }),
  lienGoogleMeet: text("lien_google_meet"),
  modeEntretien: modeEntretienEnum("mode_entretien").notNull().default("video"),
  statut: statutEntretienEnum("statut").notNull().default("planifie"),
  retourEntretien: text("retour_entretien"),
  raisonAnnulation: text("raison_annulation"),
  // Notes de préparation personnelles du candidat (privées, visibles de lui
  // seul) — ex: points à réviser, projet à présenter, questions à poser.
  notesPreparation: text("notes_preparation"),
  dateCreation: timestamp("date_creation", { withTimezone: true }).defaultNow(),
});

export const offresFinales = pgTable("offres_finales", {
  idOffreFinale: uuid("id_offre_finale").defaultRandom().primaryKey(),
  numero: serial("numero"),
  idEntretien: uuid("id_entretien")
    .notNull()
    .references(() => entretiens.idEntretien),
  idContactSuperviseur: uuid("id_contact_superviseur").references(
    () => contactsEntreprise.idContact,
  ),
  intitulePoste: varchar("intitule_poste", { length: 255 }).notNull(),
  objectifsApprentissage: text("objectifs_apprentissage"),
  volumeHoraireHebdo: smallint("volume_horaire_hebdo"), // 15 à 40, contrôlé côté applicatif
  dureeStage: dureeStageEnum("duree_stage"),
  modeTravail: modeTravailEnum("mode_travail"),
  remunerationType: remunerationTypeEnum("remuneration_type"),
  dateDebut: date("date_debut"),
  statutValidationPlateforme: statutValidationPlateformeEnum(
    "statut_validation_plateforme",
  ).default("en_attente"),
  idAdminValidateur: uuid("id_admin_validateur").references(
    () => administrateurs.idAdmin,
  ),
  dateValidation: timestamp("date_validation", { withTimezone: true }),
  statutReponseStagiaire: statutReponseStagiaireEnum(
    "statut_reponse_stagiaire",
  ).default("en_attente"),
  dateReponseStagiaire: timestamp("date_reponse_stagiaire", { withTimezone: true }),
  /** Motif fourni par le stagiaire lors d'un refus (null si acceptée / en attente). */
  motifRefusStagiaire: text("motif_refus_stagiaire"),
  dateCreation: timestamp("date_creation", { withTimezone: true }).defaultNow(),
});

export const conventionsStage = pgTable("conventions_stage", {
  idConvention: uuid("id_convention").defaultRandom().primaryKey(),
  idOffreFinale: uuid("id_offre_finale")
    .notNull()
    .unique()
    .references(() => offresFinales.idOffreFinale),
  accepteeParEntreprise: boolean("acceptee_par_entreprise").default(false),
  dateAcceptationEntreprise: timestamp("date_acceptation_entreprise", { withTimezone: true }),
  accepteeParStagiaire: boolean("acceptee_par_stagiaire").default(false),
  dateAcceptationStagiaire: timestamp("date_acceptation_stagiaire", { withTimezone: true }),
  approuveeParPlateforme: boolean("approuvee_par_plateforme").default(false),
  valideeParUniversite: boolean("validee_par_universite").default(false),
  dateValidationUniversite: timestamp("date_validation_universite", { withTimezone: true }),
  dateCreation: timestamp("date_creation", { withTimezone: true }).defaultNow(),
});

export const stages = pgTable("stages", {
  idStage: uuid("id_stage").defaultRandom().primaryKey(),
  idConvention: uuid("id_convention")
    .notNull()
    .unique()
    .references(() => conventionsStage.idConvention),
  idStagiaire: uuid("id_stagiaire")
    .notNull()
    .references(() => stagiaires.idStagiaire),
  idEntreprise: uuid("id_entreprise")
    .notNull()
    .references(() => entreprises.idEntreprise),
  idContactSuperviseur: uuid("id_contact_superviseur").references(
    () => contactsEntreprise.idContact,
  ),
  idUniversite: uuid("id_universite").references(
    () => universites.idUniversite,
  ),
  objectifsApprentissage: text("objectifs_apprentissage"),
  dateDebut: date("date_debut").notNull(),
  dateFinPrevue: date("date_fin_prevue").notNull(),
  dateFinReelle: date("date_fin_reelle"),
  statut: statutStageEnum("statut").notNull().default("actif"),
  // Évaluation manuelle du superviseur (espace Superviseur > Suivi de
  // progression). Distincte d'un calcul automatique basé sur les dates : ici
  // c'est le superviseur qui juge où en est réellement le stagiaire. null
  // tant qu'aucune valeur n'a été saisie — le frontend retombe alors sur un
  // calcul basé sur le temps écoulé (cf. superviseur.service.js).
  progressionPourcentage: smallint("progression_pourcentage"),
  dateCreation: timestamp("date_creation", { withTimezone: true }).defaultNow(),
});

// Objectifs du stage — liste évolutive (au-delà du texte libre
// objectifsApprentissage ci-dessus, qui reste le résumé initial de la
// convention). Chaque ligne peut passer de "defini" à "realise".
export const objectifsStage = pgTable("objectifs_stage", {
  idObjectif: uuid("id_objectif").defaultRandom().primaryKey(),
  idStage: uuid("id_stage")
    .notNull()
    .references(() => stages.idStage),
  description: text("description").notNull(),
  statut: statutObjectifStageEnum("statut").notNull().default("defini"),
  dateCreation: timestamp("date_creation", { withTimezone: true }).defaultNow(),
  dateRealisation: timestamp("date_realisation", { withTimezone: true }),
});

// Tâches effectuées pendant le stage — liste de travail concrète, distincte
// des objectifs (plus larges) et des entrées de journal (datées, validées).
export const tachesStage = pgTable("taches_stage", {
  idTache: uuid("id_tache").defaultRandom().primaryKey(),
  idStage: uuid("id_stage")
    .notNull()
    .references(() => stages.idStage),
  // Objectif pédagogique auquel cette tâche contribue (optionnel / rétrocompat)
  idObjectif: uuid("id_objectif").references(() => objectifsStage.idObjectif, {
    onDelete: "set null",
  }),
  description: text("description").notNull(),
  statut: statutTacheStageEnum("statut").notNull().default("a_faire"),
  dateCreation: timestamp("date_creation", { withTimezone: true }).defaultNow(),
  dateCompletion: timestamp("date_completion", { withTimezone: true }),
});

// Compétences acquises PENDANT ce stage précis — distinct de
// stagiaireCompetences (module 2) qui liste les compétences déclarées sur le
// profil général du stagiaire, indépendamment de tout stage.
export const competencesAcquisesStage = pgTable(
  "competences_acquises_stage",
  {
    idAcquisition: uuid("id_acquisition").defaultRandom().primaryKey(),
    idStage: uuid("id_stage")
      .notNull()
      .references(() => stages.idStage),
    idCompetence: uuid("id_competence")
      .notNull()
      .references(() => competences.idCompetence),
    dateAcquisition: timestamp("date_acquisition", { withTimezone: true }).defaultNow(),
  },
);

// Observations libres du superviseur sur le stage — journal d'appréciation
// distinct du "journal de stage" (qui, lui, est alimenté par le stagiaire).
export const observationsSuperviseurStage = pgTable(
  "observations_superviseur_stage",
  {
    idObservation: uuid("id_observation").defaultRandom().primaryKey(),
    idStage: uuid("id_stage")
      .notNull()
      .references(() => stages.idStage),
    idMembre: uuid("id_membre")
      .notNull()
      .references(() => membresEquipe.idMembre),
    contenu: text("contenu").notNull(),
    dateCreation: timestamp("date_creation", { withTimezone: true }).defaultNow(),
  },
);

// Journal de stage / activités — alimenté par le STAGIAIRE (une entrée par
// activité/travail réalisé), et modéré par le superviseur (validation,
// correction demandée, commentaire).
export const journalStage = pgTable("journal_stage", {
  idEntree: uuid("id_entree").defaultRandom().primaryKey(),
  idStage: uuid("id_stage")
    .notNull()
    .references(() => stages.idStage),
  titre: varchar("titre", { length: 200 }).notNull(),
  description: text("description").notNull(),
  dateActivite: date("date_activite").notNull(),
  statutValidation: statutJournalStageEnum("statut_validation")
    .notNull()
    .default("en_attente"),
  commentaireSuperviseur: text("commentaire_superviseur"),
  idMembreValidateur: uuid("id_membre_validateur").references(
    () => membresEquipe.idMembre,
  ),
  dateValidation: timestamp("date_validation", { withTimezone: true }),
  dateCreation: timestamp("date_creation", { withTimezone: true }).defaultNow(),
});

// =====================================================================
// MODULE 8 — Suivi, Coaching IA et Reconnaissance
// =====================================================================

export const evaluationsHebdomadaires = pgTable(
  "evaluations_hebdomadaires",
  {
    idEvaluation: uuid("id_evaluation").defaultRandom().primaryKey(),
    idStage: uuid("id_stage")
      .notNull()
      .references(() => stages.idStage),
    numeroSemaine: smallint("numero_semaine").notNull(),
    noteAssiduite: smallint("note_assiduite"), // 1 à 5
    noteCommunication: smallint("note_communication"),
    noteInitiative: smallint("note_initiative"),
    noteProfessionnalisme: smallint("note_professionnalisme"),
    noteTravailEquipe: smallint("note_travail_equipe"),
    notePerformanceTechnique: smallint("note_performance_technique"),
    commentaires: text("commentaires"),
    statut: statutEvaluationEnum("statut").notNull().default("en_attente"),
    dateSoumission: timestamp("date_soumission", { withTimezone: true }),
  },
  (t) => ({
    uqStageSemaine: unique("uq_evaluation_stage_semaine").on(
      t.idStage,
      t.numeroSemaine,
    ),
  }),
);

export const coachingIaSessions = pgTable("coaching_ia_sessions", {
  idSessionCoaching: uuid("id_session_coaching").defaultRandom().primaryKey(),
  idStage: uuid("id_stage")
    .notNull()
    .references(() => stages.idStage),
  idEvaluation: uuid("id_evaluation")
    .notNull()
    .unique()
    .references(() => evaluationsHebdomadaires.idEvaluation),
  forces: text("forces"),
  axesAmelioration: text("axes_amelioration"),
  actionsRecommandees: text("actions_recommandees"),
  resumeProgression: text("resume_progression"),
  dateGeneration: timestamp("date_generation", { withTimezone: true }).defaultNow(),
});

export const bibliothequeRessources = pgTable("bibliotheque_ressources", {
  idRessource: uuid("id_ressource").defaultRandom().primaryKey(),
  titre: varchar("titre", { length: 255 }).notNull(),
  typeRessource: typeRessourceEnum("type_ressource").notNull(),
  categorie: varchar("categorie", { length: 150 }),
  urlContenu: text("url_contenu"),
});

export const ressourcesConsultees = pgTable(
  "ressources_consultees",
  {
    idStagiaire: uuid("id_stagiaire")
      .notNull()
      .references(() => stagiaires.idStagiaire),
    idRessource: uuid("id_ressource")
      .notNull()
      .references(() => bibliothequeRessources.idRessource),
    dateConsultation: timestamp("date_consultation", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.idStagiaire, t.idRessource] }),
  }),
);

export const certificats = pgTable("certificats", {
  idCertificat: uuid("id_certificat").defaultRandom().primaryKey(),
  idStage: uuid("id_stage")
    .notNull()
    .unique()
    .references(() => stages.idStage),
  urlFichier: text("url_fichier"),
  codeVerification: varchar("code_verification", { length: 50 }).unique(),
  dateEmission: timestamp("date_emission", { withTimezone: true }).defaultNow(),
});

export const badges = pgTable("badges", {
  idBadge: uuid("id_badge").defaultRandom().primaryKey(),
  idStagiaire: uuid("id_stagiaire")
    .notNull()
    .references(() => stagiaires.idStagiaire),
  idStage: uuid("id_stage")
    .notNull()
    .references(() => stages.idStage),
  typeBadge: varchar("type_badge", { length: 100 }),
  dateObtention: timestamp("date_obtention", { withTimezone: true }).defaultNow(),
});

export const recommandations = pgTable("recommandations", {
  idRecommandation: uuid("id_recommandation").defaultRandom().primaryKey(),
  idStage: uuid("id_stage")
    .notNull()
    .unique()
    .references(() => stages.idStage),
  idContactAuteur: uuid("id_contact_auteur").references(
    () => contactsEntreprise.idContact,
  ),
  contenu: text("contenu").notNull(),
  visibleLinkedin: boolean("visible_linkedin").default(false),
  dateCreation: timestamp("date_creation", { withTimezone: true }).defaultNow(),
});

// =====================================================================
// MODULE 9 — Notifications et Messagerie
// =====================================================================

// export const notifications = pgTable("notifications", {
//   idNotification: uuid("id_notification").defaultRandom().primaryKey(),
//   idUtilisateur: uuid("id_utilisateur")
//     .notNull()
//     .references(() => utilisateurs.idUtilisateur),
//   typeNotification: varchar("type_notification", { length: 100 }),
//   titre: varchar("titre", { length: 255 }),
//   contenu: text("contenu"),
//   lienAction: text("lien_action"),
//   canal: canalNotificationEnum("canal").notNull().default("in_app"),
//   statutLecture: statutLectureNotifEnum("statut_lecture")
//     .notNull()
//     .default("non_lue"),
//   dateCreation: timestamp("date_creation", { withTimezone: true }).defaultNow(),
// });

export const conversations = pgTable(
  "conversations",
  {
    idConversation: uuid("id_conversation").defaultRandom().primaryKey(),
    idStage: uuid("id_stage")
      .notNull()
      .references(() => stages.idStage),
    /** entreprise = boîte entreprise↔stagiaire ; superviseur = boîte membre↔stagiaire */
    typeConversation: typeConversationEnum("type_conversation")
      .notNull()
      .default("entreprise"),
    idEntreprise: uuid("id_entreprise").references(
      () => entreprises.idEntreprise,
    ),
    /** Renseigné uniquement pour typeConversation = "superviseur" */
    idMembreEntreprise: uuid("id_membre_entreprise").references(
      () => membresEquipe.idMembre,
    ),
    statut: statutConversationEnum("statut").notNull().default("active"),
    dateCreation: timestamp("date_creation", { withTimezone: true }).defaultNow(),
  },
  // Unicité gérée par index partiels SQL (migration) :
  // - (id_stage) WHERE type = entreprise
  // - (id_stage, id_membre_entreprise) WHERE type = superviseur
);

export const messages = pgTable("messages", {
  idMessage: uuid("id_message").defaultRandom().primaryKey(),
  idConversation: uuid("id_conversation")
    .notNull()
    .references(() => conversations.idConversation),
  idExpediteur: uuid("id_expediteur")
    .notNull()
    .references(() => utilisateurs.idUtilisateur),
  contenu: text("contenu"),
  statutLecture: statutLectureMessageEnum("statut_lecture")
    .notNull()
    .default("envoye"),
  dateEnvoi: timestamp("date_envoi", { withTimezone: true }).defaultNow(),
});

export const piecesJointesMessage = pgTable("pieces_jointes_message", {
  idPieceJointe: uuid("id_piece_jointe").defaultRandom().primaryKey(),
  idMessage: uuid("id_message")
    .notNull()
    .references(() => messages.idMessage),
  urlFichier: text("url_fichier").notNull(),
  nomFichier: varchar("nom_fichier", { length: 255 }),
});


// Favoris d'offres (espace stagiaire)
export const favorisOffres = pgTable(
  "favoris_offres",
  {
    idFavori: uuid("id_favori").defaultRandom().primaryKey(),
    idStagiaire: uuid("id_stagiaire")
      .notNull()
      .references(() => stagiaires.idStagiaire, { onDelete: "cascade" }),
    idOffre: uuid("id_offre")
      .notNull()
      .references(() => offresStage.idOffre, { onDelete: "cascade" }),
    dateAjout: timestamp("date_ajout", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    uqStagiaireOffre: unique("uq_favori_stagiaire_offre").on(
      t.idStagiaire,
      t.idOffre,
    ),
  }),
);


export const journalActionsAdmin = pgTable("journal_actions_admin", {
  idJournal: uuid("id_journal").defaultRandom().primaryKey(),
  idAdministrateur: uuid("id_administrateur").references(() => utilisateurs.idUtilisateur),
  typeEntite: varchar("type_entite", { length: 50 }).notNull(),
  idEntite: uuid("id_entite"),
  action: varchar("action", { length: 100 }).notNull(),
  ancienStatut: varchar("ancien_statut", { length: 50 }),
  nouveauStatut: varchar("nouveau_statut", { length: 50 }),
  motif: text("motif"),
  dateCreation: timestamp("date_creation", { withTimezone: true }).defaultNow(),
});

// =====================================================================
// Alertes de sécurité Admin (couche alerte — consomme le scoring existant)
// =====================================================================
export const graviteAlerteSecuriteEnum = pgEnum("gravite_alerte_securite", [
  "information",
  "attention",
  "important",
  "critique",
]);
export const statutAlerteSecuriteEnum = pgEnum("statut_alerte_securite", [
  "nouvelle",
  "examinee",
  "en_cours",
  "resolue",
]);

export const alertesSecurite = pgTable(
  "alertes_securite",
  {
    idAlerte: uuid("id_alerte").defaultRandom().primaryKey(),
    fingerprint: varchar("fingerprint", { length: 191 }).notNull(),
    typeAlerte: varchar("type_alerte", { length: 80 }).notNull(),
    gravite: graviteAlerteSecuriteEnum("gravite").notNull().default("attention"),
    statut: statutAlerteSecuriteEnum("statut").notNull().default("nouvelle"),
    titre: varchar("titre", { length: 255 }).notNull(),
    description: text("description"),
    idUtilisateurCible: uuid("id_utilisateur_cible").references(
      () => utilisateurs.idUtilisateur,
    ),
    emailCible: varchar("email_cible", { length: 255 }),
    nomCible: varchar("nom_cible", { length: 255 }),
    niveauDetection: varchar("niveau_detection", { length: 50 }),
    scoreGlobal: integer("score_global").default(0),
    scorePartage: integer("score_partage").default(0),
    scoreAutomatisation: integer("score_automatisation").default(0),
    scoreAuthentification: integer("score_authentification").default(0),
    signaux: jsonb("signaux").default([]),
    nbEvenements: integer("nb_evenements").notNull().default(1),
    metadata: jsonb("metadata").default({}),
    dateCreation: timestamp("date_creation", { withTimezone: true }).defaultNow(),
    dateMaj: timestamp("date_maj", { withTimezone: true }).defaultNow(),
    dateDerniereDetection: timestamp("date_derniere_detection", { withTimezone: true }).defaultNow(),
    dateExamen: timestamp("date_examen", { withTimezone: true }),
    dateResolution: timestamp("date_resolution", { withTimezone: true }),
    idAdminResolution: uuid("id_admin_resolution").references(
      () => utilisateurs.idUtilisateur,
    ),
    notifie: boolean("notifie").notNull().default(false),
  },
  (t) => ({
    fingerprintUidx: uniqueIndex("alertes_securite_fingerprint_uidx").on(
      t.fingerprint,
    ),
  }),
);
