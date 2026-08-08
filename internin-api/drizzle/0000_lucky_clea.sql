CREATE TYPE "public"."canal_notification" AS ENUM('in_app', 'email');--> statement-breakpoint
CREATE TYPE "public"."duree_stage" AS ENUM('1_mois', '2_mois', '3_mois');--> statement-breakpoint
CREATE TYPE "public"."jour_semaine" AS ENUM('lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche');--> statement-breakpoint
CREATE TYPE "public"."methode_connexion" AS ENUM('email', 'google');--> statement-breakpoint
CREATE TYPE "public"."mode_entretien" AS ENUM('video', 'telephone', 'presentiel');--> statement-breakpoint
CREATE TYPE "public"."mode_travail" AS ENUM('distance', 'hybride', 'presentiel');--> statement-breakpoint
CREATE TYPE "public"."niveau_competence" AS ENUM('debutant', 'intermediaire', 'avance');--> statement-breakpoint
CREATE TYPE "public"."origine_candidature" AS ENUM('candidature_spontanee', 'invitation_entreprise');--> statement-breakpoint
CREATE TYPE "public"."remuneration_type" AS ENUM('aucune', 'indemnite_transport', 'indemnite_repas', 'allocation_mensuelle');--> statement-breakpoint
CREATE TYPE "public"."role_admin" AS ENUM('super_admin', 'operations', 'support', 'relations_entreprises', 'relations_universites', 'conformite');--> statement-breakpoint
CREATE TYPE "public"."role_personnel_universite" AS ENUM('conseiller_carriere', 'coordinateur_pedagogique', 'coordinateur_stage');--> statement-breakpoint
CREATE TYPE "public"."statut_academique" AS ENUM('etudiant', 'jeune_diplome');--> statement-breakpoint
CREATE TYPE "public"."statut_candidature" AS ENUM('soumise', 'consultee', 'preselectionnee', 'rejetee', 'retiree', 'acceptee');--> statement-breakpoint
CREATE TYPE "public"."statut_compte" AS ENUM('inactif', 'actif', 'suspendu');--> statement-breakpoint
CREATE TYPE "public"."statut_conversation" AS ENUM('active', 'archivee');--> statement-breakpoint
CREATE TYPE "public"."statut_entretien" AS ENUM('planifie', 'valide', 'confirme', 'reprogramme', 'termine', 'annule', 'absent');--> statement-breakpoint
CREATE TYPE "public"."statut_evaluation" AS ENUM('en_attente', 'soumise', 'en_retard');--> statement-breakpoint
CREATE TYPE "public"."statut_invitation" AS ENUM('invite', 'actif', 'desactive');--> statement-breakpoint
CREATE TYPE "public"."statut_lecture_message" AS ENUM('envoye', 'lu');--> statement-breakpoint
CREATE TYPE "public"."statut_lecture_notif" AS ENUM('non_lue', 'lue');--> statement-breakpoint
CREATE TYPE "public"."statut_litige" AS ENUM('ouvert', 'en_cours', 'resolu', 'rejete');--> statement-breakpoint
CREATE TYPE "public"."statut_offre_stage" AS ENUM('brouillon', 'publie', 'ferme', 'archive');--> statement-breakpoint
CREATE TYPE "public"."statut_reponse_stagiaire" AS ENUM('en_attente', 'acceptee', 'refusee');--> statement-breakpoint
CREATE TYPE "public"."statut_stage" AS ENUM('actif', 'termine', 'interrompu');--> statement-breakpoint
CREATE TYPE "public"."statut_stage_stagiaire" AS ENUM('disponible', 'en_processus', 'actif', 'termine');--> statement-breakpoint
CREATE TYPE "public"."statut_validation_plateforme" AS ENUM('en_attente', 'approuve', 'renvoye_modification', 'rejete');--> statement-breakpoint
CREATE TYPE "public"."statut_verification" AS ENUM('en_attente', 'verifiee', 'rejetee');--> statement-breakpoint
CREATE TYPE "public"."statut_verification_token" AS ENUM('en_attente', 'utilise', 'expire');--> statement-breakpoint
CREATE TYPE "public"."taille_entreprise" AS ENUM('1-10', '11-50', '51-200', '201-500', '500+');--> statement-breakpoint
CREATE TYPE "public"."type_competence" AS ENUM('technique', 'professionnelle', 'langue');--> statement-breakpoint
CREATE TYPE "public"."type_document" AS ENUM('cv', 'registre_commerce', 'certificat_constitution', 'justificatif_entreprise', 'accreditation_universite', 'enregistrement_officiel', 'autorisation_administrative', 'autre');--> statement-breakpoint
CREATE TYPE "public"."type_formation" AS ENUM('en_cours', 'obtenue');--> statement-breakpoint
CREATE TYPE "public"."type_ressource" AS ENUM('article', 'question_reflexion', 'scenario_professionnel', 'modele_communication', 'checklist', 'exemple_email', 'guide_reunion');--> statement-breakpoint
CREATE TYPE "public"."type_utilisateur" AS ENUM('stagiaire', 'entreprise', 'universite', 'administrateur');--> statement-breakpoint
CREATE TYPE "public"."type_verification" AS ENUM('verification_email', 'reinitialisation_mdp');--> statement-breakpoint
CREATE TABLE "administrateurs" (
	"id_admin" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_utilisateur" uuid NOT NULL,
	"nom" varchar(150) NOT NULL,
	"role_admin" "role_admin" NOT NULL,
	CONSTRAINT "administrateurs_id_utilisateur_unique" UNIQUE("id_utilisateur")
);
--> statement-breakpoint
CREATE TABLE "badges" (
	"id_badge" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_stagiaire" uuid NOT NULL,
	"id_stage" uuid NOT NULL,
	"type_badge" varchar(100),
	"date_obtention" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bibliotheque_ressources" (
	"id_ressource" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"titre" varchar(255) NOT NULL,
	"type_ressource" "type_ressource" NOT NULL,
	"categorie" varchar(150),
	"url_contenu" text
);
--> statement-breakpoint
CREATE TABLE "candidatures" (
	"id_candidature" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_stagiaire" uuid NOT NULL,
	"id_offre" uuid NOT NULL,
	"origine" "origine_candidature" NOT NULL,
	"statut" "statut_candidature" DEFAULT 'soumise' NOT NULL,
	"lettre_motivation" text,
	"date_candidature" timestamp DEFAULT now(),
	"date_maj_statut" timestamp DEFAULT now(),
	CONSTRAINT "uq_candidature_stagiaire_offre" UNIQUE("id_stagiaire","id_offre")
);
--> statement-breakpoint
CREATE TABLE "centres_interet" (
	"id_centre_interet" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nom" varchar(150) NOT NULL,
	CONSTRAINT "centres_interet_nom_unique" UNIQUE("nom")
);
--> statement-breakpoint
CREATE TABLE "certificats" (
	"id_certificat" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_stage" uuid NOT NULL,
	"url_fichier" text,
	"code_verification" varchar(50),
	"date_emission" timestamp DEFAULT now(),
	CONSTRAINT "certificats_id_stage_unique" UNIQUE("id_stage"),
	CONSTRAINT "certificats_code_verification_unique" UNIQUE("code_verification")
);
--> statement-breakpoint
CREATE TABLE "coaching_ia_sessions" (
	"id_session_coaching" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_stage" uuid NOT NULL,
	"id_evaluation" uuid NOT NULL,
	"forces" text,
	"axes_amelioration" text,
	"actions_recommandees" text,
	"resume_progression" text,
	"date_generation" timestamp DEFAULT now(),
	CONSTRAINT "coaching_ia_sessions_id_evaluation_unique" UNIQUE("id_evaluation")
);
--> statement-breakpoint
CREATE TABLE "competences" (
	"id_competence" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nom" varchar(150) NOT NULL,
	"type_competence" "type_competence" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contacts_entreprise" (
	"id_contact" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_entreprise" uuid NOT NULL,
	"nom" varchar(150) NOT NULL,
	"fonction" varchar(150),
	"email" varchar(255),
	"telephone" varchar(30),
	"est_contact_principal" boolean DEFAULT false,
	"peut_etre_superviseur" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "conventions_stage" (
	"id_convention" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_offre_finale" uuid NOT NULL,
	"acceptee_par_entreprise" boolean DEFAULT false,
	"date_acceptation_entreprise" timestamp,
	"acceptee_par_stagiaire" boolean DEFAULT false,
	"date_acceptation_stagiaire" timestamp,
	"approuvee_par_plateforme" boolean DEFAULT false,
	"date_creation" timestamp DEFAULT now(),
	CONSTRAINT "conventions_stage_id_offre_finale_unique" UNIQUE("id_offre_finale")
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id_conversation" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_stage" uuid NOT NULL,
	"statut" "statut_conversation" DEFAULT 'active' NOT NULL,
	"date_creation" timestamp DEFAULT now(),
	CONSTRAINT "conversations_id_stage_unique" UNIQUE("id_stage")
);
--> statement-breakpoint
CREATE TABLE "disponibilites_stagiaire" (
	"id_disponibilite" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_stagiaire" uuid NOT NULL,
	"jour_semaine" "jour_semaine" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id_document" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_utilisateur" uuid NOT NULL,
	"type_document" "type_document" NOT NULL,
	"url_fichier" text NOT NULL,
	"nom_fichier" varchar(255),
	"date_upload" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "entreprises" (
	"id_entreprise" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_utilisateur" uuid NOT NULL,
	"nom_entreprise" varchar(255) NOT NULL,
	"logo_url" text,
	"secteur_activite" varchar(150),
	"taille_entreprise" "taille_entreprise",
	"site_web" text,
	"linkedin_url" text,
	"pays" varchar(100),
	"ville" varchar(100),
	"adresse" text,
	"a_propos" text,
	"mission" text,
	"culture_entreprise" text,
	"statut_verification" "statut_verification" DEFAULT 'en_attente',
	"date_verification" timestamp,
	"admin_verificateur_id" uuid,
	"date_creation" timestamp DEFAULT now(),
	CONSTRAINT "entreprises_id_utilisateur_unique" UNIQUE("id_utilisateur")
);
--> statement-breakpoint
CREATE TABLE "entretiens" (
	"id_entretien" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_candidature" uuid NOT NULL,
	"date_heure" timestamp NOT NULL,
	"date_heure_proposee" timestamp,
	"lien_google_meet" text,
	"mode_entretien" "mode_entretien" DEFAULT 'video' NOT NULL,
	"statut" "statut_entretien" DEFAULT 'planifie' NOT NULL,
	"retour_entretien" text,
	"raison_annulation" text,
	"date_creation" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "evaluations_hebdomadaires" (
	"id_evaluation" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_stage" uuid NOT NULL,
	"numero_semaine" smallint NOT NULL,
	"note_assiduite" smallint,
	"note_communication" smallint,
	"note_initiative" smallint,
	"note_professionnalisme" smallint,
	"note_travail_equipe" smallint,
	"note_performance_technique" smallint,
	"commentaires" text,
	"statut" "statut_evaluation" DEFAULT 'en_attente' NOT NULL,
	"date_soumission" timestamp,
	CONSTRAINT "uq_evaluation_stage_semaine" UNIQUE("id_stage","numero_semaine")
);
--> statement-breakpoint
CREATE TABLE "formations" (
	"id_formation" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_stagiaire" uuid NOT NULL,
	"type_formation" "type_formation" NOT NULL,
	"nom_universite" varchar(255) NOT NULL,
	"faculte" varchar(255),
	"departement" varchar(255),
	"diplome" varchar(255) NOT NULL,
	"annee_etude" smallint,
	"annee_obtention" smallint
);
--> statement-breakpoint
CREATE TABLE "litiges_reclamations" (
	"id_litige" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_stage" uuid,
	"id_utilisateur_plaignant" uuid NOT NULL,
	"id_admin_assigne" uuid,
	"type_litige" varchar(150),
	"description" text NOT NULL,
	"statut" "statut_litige" DEFAULT 'ouvert' NOT NULL,
	"date_creation" timestamp DEFAULT now(),
	"date_resolution" timestamp
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id_message" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_conversation" uuid NOT NULL,
	"id_expediteur" uuid NOT NULL,
	"contenu" text,
	"statut_lecture" "statut_lecture_message" DEFAULT 'envoye' NOT NULL,
	"date_envoi" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "modeles_email" (
	"id_modele" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code_modele" varchar(100) NOT NULL,
	"sujet" varchar(255),
	"corps_html" text,
	CONSTRAINT "modeles_email_code_modele_unique" UNIQUE("code_modele")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id_notification" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_utilisateur" uuid NOT NULL,
	"type_notification" varchar(100),
	"titre" varchar(255),
	"contenu" text,
	"lien_action" text,
	"canal" "canal_notification" DEFAULT 'in_app' NOT NULL,
	"statut_lecture" "statut_lecture_notif" DEFAULT 'non_lue' NOT NULL,
	"date_creation" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "objectifs_developpement" (
	"id_objectif" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nom" varchar(150) NOT NULL,
	CONSTRAINT "objectifs_developpement_nom_unique" UNIQUE("nom")
);
--> statement-breakpoint
CREATE TABLE "offres_finales" (
	"id_offre_finale" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_entretien" uuid NOT NULL,
	"id_contact_superviseur" uuid,
	"intitule_poste" varchar(255) NOT NULL,
	"objectifs_apprentissage" text,
	"volume_horaire_hebdo" smallint,
	"duree_stage" "duree_stage",
	"mode_travail" "mode_travail",
	"remuneration_type" "remuneration_type",
	"date_debut" date,
	"statut_validation_plateforme" "statut_validation_plateforme" DEFAULT 'en_attente',
	"id_admin_validateur" uuid,
	"date_validation" timestamp,
	"statut_reponse_stagiaire" "statut_reponse_stagiaire" DEFAULT 'en_attente',
	"date_reponse_stagiaire" timestamp,
	"date_creation" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "offres_stage" (
	"id_offre" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_entreprise" uuid NOT NULL,
	"titre" varchar(255) NOT NULL,
	"departement" varchar(150),
	"secteur_activite" varchar(150),
	"description" text NOT NULL,
	"responsabilites" text,
	"competences_requises" text,
	"opportunites_apprentissage" text,
	"mode_travail" "mode_travail",
	"remuneration_type" "remuneration_type",
	"montant_remuneration" numeric(10, 2),
	"nombre_postes" smallint DEFAULT 1,
	"id_contact_superviseur" uuid,
	"statut" "statut_offre_stage" DEFAULT 'brouillon' NOT NULL,
	"date_publication" timestamp,
	"date_creation" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "personnel_universite" (
	"id_personnel" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_universite" uuid NOT NULL,
	"nom" varchar(150) NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" "role_personnel_universite" NOT NULL,
	"statut_invitation" "statut_invitation" DEFAULT 'invite'
);
--> statement-breakpoint
CREATE TABLE "pieces_jointes_message" (
	"id_piece_jointe" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_message" uuid NOT NULL,
	"url_fichier" text NOT NULL,
	"nom_fichier" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "recommandations" (
	"id_recommandation" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_stage" uuid NOT NULL,
	"id_contact_auteur" uuid,
	"contenu" text NOT NULL,
	"visible_linkedin" boolean DEFAULT false,
	"date_creation" timestamp DEFAULT now(),
	CONSTRAINT "recommandations_id_stage_unique" UNIQUE("id_stage")
);
--> statement-breakpoint
CREATE TABLE "ressources_consultees" (
	"id_stagiaire" uuid NOT NULL,
	"id_ressource" uuid NOT NULL,
	"date_consultation" timestamp DEFAULT now(),
	CONSTRAINT "ressources_consultees_id_stagiaire_id_ressource_pk" PRIMARY KEY("id_stagiaire","id_ressource")
);
--> statement-breakpoint
CREATE TABLE "sessions_utilisateur" (
	"id_session" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_utilisateur" uuid NOT NULL,
	"jeton" varchar(512) NOT NULL,
	"adresse_ip" varchar(45),
	"date_expiration" timestamp NOT NULL,
	"date_creation" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "stages" (
	"id_stage" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_convention" uuid NOT NULL,
	"id_stagiaire" uuid NOT NULL,
	"id_entreprise" uuid NOT NULL,
	"id_contact_superviseur" uuid,
	"id_universite" uuid,
	"objectifs_apprentissage" text,
	"date_debut" date NOT NULL,
	"date_fin_prevue" date NOT NULL,
	"date_fin_reelle" date,
	"statut" "statut_stage" DEFAULT 'actif' NOT NULL,
	"date_creation" timestamp DEFAULT now(),
	CONSTRAINT "stages_id_convention_unique" UNIQUE("id_convention")
);
--> statement-breakpoint
CREATE TABLE "stagiaire_centres_interet" (
	"id_stagiaire" uuid NOT NULL,
	"id_centre_interet" uuid NOT NULL,
	CONSTRAINT "stagiaire_centres_interet_id_stagiaire_id_centre_interet_pk" PRIMARY KEY("id_stagiaire","id_centre_interet")
);
--> statement-breakpoint
CREATE TABLE "stagiaire_competences" (
	"id_stagiaire" uuid NOT NULL,
	"id_competence" uuid NOT NULL,
	"niveau" "niveau_competence",
	CONSTRAINT "stagiaire_competences_id_stagiaire_id_competence_pk" PRIMARY KEY("id_stagiaire","id_competence")
);
--> statement-breakpoint
CREATE TABLE "stagiaire_objectifs_developpement" (
	"id_stagiaire" uuid NOT NULL,
	"id_objectif" uuid NOT NULL,
	CONSTRAINT "stagiaire_objectifs_developpement_id_stagiaire_id_objectif_pk" PRIMARY KEY("id_stagiaire","id_objectif")
);
--> statement-breakpoint
CREATE TABLE "stagiaires" (
	"id_stagiaire" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_utilisateur" uuid NOT NULL,
	"prenom" varchar(100) NOT NULL,
	"nom" varchar(100) NOT NULL,
	"photo_profil_url" text,
	"telephone" varchar(30) NOT NULL,
	"pays" varchar(100) NOT NULL,
	"ville" varchar(100) NOT NULL,
	"date_naissance" date,
	"statut_academique" "statut_academique",
	"cv_url" text NOT NULL,
	"linkedin_url" text,
	"github_url" text,
	"behance_url" text,
	"portfolio_url" text,
	"site_web_url" text,
	"duree_stage_souhaitee" "duree_stage",
	"heures_hebdo_souhaitees" smallint,
	"date_debut_souhaitee" date,
	"score_completude_profil" smallint DEFAULT 0,
	"statut_stage" "statut_stage_stagiaire" DEFAULT 'disponible',
	"id_universite" uuid,
	"date_creation" timestamp DEFAULT now(),
	CONSTRAINT "stagiaires_id_utilisateur_unique" UNIQUE("id_utilisateur")
);
--> statement-breakpoint
CREATE TABLE "universites" (
	"id_universite" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_utilisateur" uuid NOT NULL,
	"nom_universite" varchar(255) NOT NULL,
	"email_officiel" varchar(255) NOT NULL,
	"logo_url" text,
	"site_web" text,
	"pays" varchar(100),
	"type_etablissement" varchar(150),
	"nombre_etudiants" integer,
	"contact_service_carriere" varchar(255),
	"periode_stage_habituelle" varchar(150),
	"heures_recommandees_semaine" smallint,
	"nom_coordinateur_stage" varchar(150),
	"statut_verification" "statut_verification" DEFAULT 'en_attente',
	"date_creation" timestamp DEFAULT now(),
	CONSTRAINT "universites_id_utilisateur_unique" UNIQUE("id_utilisateur")
);
--> statement-breakpoint
CREATE TABLE "utilisateurs" (
	"id_utilisateur" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"mot_de_passe_hash" varchar(255),
	"type_utilisateur" "type_utilisateur" NOT NULL,
	"methode_connexion" "methode_connexion" DEFAULT 'email' NOT NULL,
	"email_verifie" boolean DEFAULT false,
	"statut_compte" "statut_compte" DEFAULT 'inactif' NOT NULL,
	"derniere_connexion" timestamp,
	"date_creation" timestamp DEFAULT now(),
	"date_maj" timestamp DEFAULT now(),
	CONSTRAINT "utilisateurs_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verifications_email" (
	"id_verification" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_utilisateur" uuid NOT NULL,
	"type" "type_verification" NOT NULL,
	"code_jeton" varchar(255) NOT NULL,
	"statut" "statut_verification_token" DEFAULT 'en_attente' NOT NULL,
	"date_expiration" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "administrateurs" ADD CONSTRAINT "administrateurs_id_utilisateur_utilisateurs_id_utilisateur_fk" FOREIGN KEY ("id_utilisateur") REFERENCES "public"."utilisateurs"("id_utilisateur") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "badges" ADD CONSTRAINT "badges_id_stagiaire_stagiaires_id_stagiaire_fk" FOREIGN KEY ("id_stagiaire") REFERENCES "public"."stagiaires"("id_stagiaire") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "badges" ADD CONSTRAINT "badges_id_stage_stages_id_stage_fk" FOREIGN KEY ("id_stage") REFERENCES "public"."stages"("id_stage") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidatures" ADD CONSTRAINT "candidatures_id_stagiaire_stagiaires_id_stagiaire_fk" FOREIGN KEY ("id_stagiaire") REFERENCES "public"."stagiaires"("id_stagiaire") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidatures" ADD CONSTRAINT "candidatures_id_offre_offres_stage_id_offre_fk" FOREIGN KEY ("id_offre") REFERENCES "public"."offres_stage"("id_offre") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificats" ADD CONSTRAINT "certificats_id_stage_stages_id_stage_fk" FOREIGN KEY ("id_stage") REFERENCES "public"."stages"("id_stage") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coaching_ia_sessions" ADD CONSTRAINT "coaching_ia_sessions_id_stage_stages_id_stage_fk" FOREIGN KEY ("id_stage") REFERENCES "public"."stages"("id_stage") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coaching_ia_sessions" ADD CONSTRAINT "coaching_ia_sessions_id_evaluation_evaluations_hebdomadaires_id_evaluation_fk" FOREIGN KEY ("id_evaluation") REFERENCES "public"."evaluations_hebdomadaires"("id_evaluation") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts_entreprise" ADD CONSTRAINT "contacts_entreprise_id_entreprise_entreprises_id_entreprise_fk" FOREIGN KEY ("id_entreprise") REFERENCES "public"."entreprises"("id_entreprise") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conventions_stage" ADD CONSTRAINT "conventions_stage_id_offre_finale_offres_finales_id_offre_finale_fk" FOREIGN KEY ("id_offre_finale") REFERENCES "public"."offres_finales"("id_offre_finale") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_id_stage_stages_id_stage_fk" FOREIGN KEY ("id_stage") REFERENCES "public"."stages"("id_stage") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disponibilites_stagiaire" ADD CONSTRAINT "disponibilites_stagiaire_id_stagiaire_stagiaires_id_stagiaire_fk" FOREIGN KEY ("id_stagiaire") REFERENCES "public"."stagiaires"("id_stagiaire") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_id_utilisateur_utilisateurs_id_utilisateur_fk" FOREIGN KEY ("id_utilisateur") REFERENCES "public"."utilisateurs"("id_utilisateur") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entreprises" ADD CONSTRAINT "entreprises_id_utilisateur_utilisateurs_id_utilisateur_fk" FOREIGN KEY ("id_utilisateur") REFERENCES "public"."utilisateurs"("id_utilisateur") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entreprises" ADD CONSTRAINT "entreprises_admin_verificateur_id_administrateurs_id_admin_fk" FOREIGN KEY ("admin_verificateur_id") REFERENCES "public"."administrateurs"("id_admin") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entretiens" ADD CONSTRAINT "entretiens_id_candidature_candidatures_id_candidature_fk" FOREIGN KEY ("id_candidature") REFERENCES "public"."candidatures"("id_candidature") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluations_hebdomadaires" ADD CONSTRAINT "evaluations_hebdomadaires_id_stage_stages_id_stage_fk" FOREIGN KEY ("id_stage") REFERENCES "public"."stages"("id_stage") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formations" ADD CONSTRAINT "formations_id_stagiaire_stagiaires_id_stagiaire_fk" FOREIGN KEY ("id_stagiaire") REFERENCES "public"."stagiaires"("id_stagiaire") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "litiges_reclamations" ADD CONSTRAINT "litiges_reclamations_id_stage_stages_id_stage_fk" FOREIGN KEY ("id_stage") REFERENCES "public"."stages"("id_stage") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "litiges_reclamations" ADD CONSTRAINT "litiges_reclamations_id_utilisateur_plaignant_utilisateurs_id_utilisateur_fk" FOREIGN KEY ("id_utilisateur_plaignant") REFERENCES "public"."utilisateurs"("id_utilisateur") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "litiges_reclamations" ADD CONSTRAINT "litiges_reclamations_id_admin_assigne_administrateurs_id_admin_fk" FOREIGN KEY ("id_admin_assigne") REFERENCES "public"."administrateurs"("id_admin") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_id_conversation_conversations_id_conversation_fk" FOREIGN KEY ("id_conversation") REFERENCES "public"."conversations"("id_conversation") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_id_expediteur_utilisateurs_id_utilisateur_fk" FOREIGN KEY ("id_expediteur") REFERENCES "public"."utilisateurs"("id_utilisateur") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_id_utilisateur_utilisateurs_id_utilisateur_fk" FOREIGN KEY ("id_utilisateur") REFERENCES "public"."utilisateurs"("id_utilisateur") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offres_finales" ADD CONSTRAINT "offres_finales_id_entretien_entretiens_id_entretien_fk" FOREIGN KEY ("id_entretien") REFERENCES "public"."entretiens"("id_entretien") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offres_finales" ADD CONSTRAINT "offres_finales_id_contact_superviseur_contacts_entreprise_id_contact_fk" FOREIGN KEY ("id_contact_superviseur") REFERENCES "public"."contacts_entreprise"("id_contact") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offres_finales" ADD CONSTRAINT "offres_finales_id_admin_validateur_administrateurs_id_admin_fk" FOREIGN KEY ("id_admin_validateur") REFERENCES "public"."administrateurs"("id_admin") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offres_stage" ADD CONSTRAINT "offres_stage_id_entreprise_entreprises_id_entreprise_fk" FOREIGN KEY ("id_entreprise") REFERENCES "public"."entreprises"("id_entreprise") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offres_stage" ADD CONSTRAINT "offres_stage_id_contact_superviseur_contacts_entreprise_id_contact_fk" FOREIGN KEY ("id_contact_superviseur") REFERENCES "public"."contacts_entreprise"("id_contact") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personnel_universite" ADD CONSTRAINT "personnel_universite_id_universite_universites_id_universite_fk" FOREIGN KEY ("id_universite") REFERENCES "public"."universites"("id_universite") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pieces_jointes_message" ADD CONSTRAINT "pieces_jointes_message_id_message_messages_id_message_fk" FOREIGN KEY ("id_message") REFERENCES "public"."messages"("id_message") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommandations" ADD CONSTRAINT "recommandations_id_stage_stages_id_stage_fk" FOREIGN KEY ("id_stage") REFERENCES "public"."stages"("id_stage") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommandations" ADD CONSTRAINT "recommandations_id_contact_auteur_contacts_entreprise_id_contact_fk" FOREIGN KEY ("id_contact_auteur") REFERENCES "public"."contacts_entreprise"("id_contact") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ressources_consultees" ADD CONSTRAINT "ressources_consultees_id_stagiaire_stagiaires_id_stagiaire_fk" FOREIGN KEY ("id_stagiaire") REFERENCES "public"."stagiaires"("id_stagiaire") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ressources_consultees" ADD CONSTRAINT "ressources_consultees_id_ressource_bibliotheque_ressources_id_ressource_fk" FOREIGN KEY ("id_ressource") REFERENCES "public"."bibliotheque_ressources"("id_ressource") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions_utilisateur" ADD CONSTRAINT "sessions_utilisateur_id_utilisateur_utilisateurs_id_utilisateur_fk" FOREIGN KEY ("id_utilisateur") REFERENCES "public"."utilisateurs"("id_utilisateur") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stages" ADD CONSTRAINT "stages_id_convention_conventions_stage_id_convention_fk" FOREIGN KEY ("id_convention") REFERENCES "public"."conventions_stage"("id_convention") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stages" ADD CONSTRAINT "stages_id_stagiaire_stagiaires_id_stagiaire_fk" FOREIGN KEY ("id_stagiaire") REFERENCES "public"."stagiaires"("id_stagiaire") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stages" ADD CONSTRAINT "stages_id_entreprise_entreprises_id_entreprise_fk" FOREIGN KEY ("id_entreprise") REFERENCES "public"."entreprises"("id_entreprise") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stages" ADD CONSTRAINT "stages_id_contact_superviseur_contacts_entreprise_id_contact_fk" FOREIGN KEY ("id_contact_superviseur") REFERENCES "public"."contacts_entreprise"("id_contact") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stages" ADD CONSTRAINT "stages_id_universite_universites_id_universite_fk" FOREIGN KEY ("id_universite") REFERENCES "public"."universites"("id_universite") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stagiaire_centres_interet" ADD CONSTRAINT "stagiaire_centres_interet_id_stagiaire_stagiaires_id_stagiaire_fk" FOREIGN KEY ("id_stagiaire") REFERENCES "public"."stagiaires"("id_stagiaire") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stagiaire_centres_interet" ADD CONSTRAINT "stagiaire_centres_interet_id_centre_interet_centres_interet_id_centre_interet_fk" FOREIGN KEY ("id_centre_interet") REFERENCES "public"."centres_interet"("id_centre_interet") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stagiaire_competences" ADD CONSTRAINT "stagiaire_competences_id_stagiaire_stagiaires_id_stagiaire_fk" FOREIGN KEY ("id_stagiaire") REFERENCES "public"."stagiaires"("id_stagiaire") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stagiaire_competences" ADD CONSTRAINT "stagiaire_competences_id_competence_competences_id_competence_fk" FOREIGN KEY ("id_competence") REFERENCES "public"."competences"("id_competence") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stagiaire_objectifs_developpement" ADD CONSTRAINT "stagiaire_objectifs_developpement_id_stagiaire_stagiaires_id_stagiaire_fk" FOREIGN KEY ("id_stagiaire") REFERENCES "public"."stagiaires"("id_stagiaire") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stagiaire_objectifs_developpement" ADD CONSTRAINT "stagiaire_objectifs_developpement_id_objectif_objectifs_developpement_id_objectif_fk" FOREIGN KEY ("id_objectif") REFERENCES "public"."objectifs_developpement"("id_objectif") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stagiaires" ADD CONSTRAINT "stagiaires_id_utilisateur_utilisateurs_id_utilisateur_fk" FOREIGN KEY ("id_utilisateur") REFERENCES "public"."utilisateurs"("id_utilisateur") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stagiaires" ADD CONSTRAINT "stagiaires_id_universite_universites_id_universite_fk" FOREIGN KEY ("id_universite") REFERENCES "public"."universites"("id_universite") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "universites" ADD CONSTRAINT "universites_id_utilisateur_utilisateurs_id_utilisateur_fk" FOREIGN KEY ("id_utilisateur") REFERENCES "public"."utilisateurs"("id_utilisateur") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verifications_email" ADD CONSTRAINT "verifications_email_id_utilisateur_utilisateurs_id_utilisateur_fk" FOREIGN KEY ("id_utilisateur") REFERENCES "public"."utilisateurs"("id_utilisateur") ON DELETE no action ON UPDATE no action;