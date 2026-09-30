CREATE TYPE "public"."source_rattachement_universitaire" AS ENUM('invitation', 'code', 'lien', 'admin', 'import');--> statement-breakpoint
CREATE TYPE "public"."statut_rattachement_universitaire" AS ENUM('en_attente', 'confirme', 'refuse', 'expire', 'annule');--> statement-breakpoint
CREATE TABLE "codes_rattachement_universite" (
	"id_code" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_universite" uuid NOT NULL,
	"code_hash" varchar(64) NOT NULL,
	"actif" boolean DEFAULT true NOT NULL,
	"date_expiration" timestamp with time zone,
	"nombre_utilisations" integer DEFAULT 0 NOT NULL,
	"nombre_utilisations_max" integer DEFAULT 100 NOT NULL,
	"date_creation" timestamp with time zone DEFAULT now(),
	"date_revocation" timestamp with time zone,
	CONSTRAINT "codes_rattachement_universite_code_hash_unique" UNIQUE("code_hash")
);
--> statement-breakpoint
CREATE TABLE "journal_rattachements_universitaire" (
	"id_journal" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_universite" uuid NOT NULL,
	"id_rattachement" uuid,
	"id_stagiaire" uuid,
	"id_utilisateur_acteur" uuid,
	"action" varchar(100) NOT NULL,
	"metadata" jsonb,
	"date_creation" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "liens_rattachement_universite" (
	"id_lien" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_universite" uuid NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"actif" boolean DEFAULT true NOT NULL,
	"date_expiration" timestamp with time zone,
	"nombre_utilisations" integer DEFAULT 0 NOT NULL,
	"nombre_utilisations_max" integer DEFAULT 500 NOT NULL,
	"date_creation" timestamp with time zone DEFAULT now(),
	"date_revocation" timestamp with time zone,
	CONSTRAINT "liens_rattachement_universite_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "rattachements_universitaires" (
	"id_rattachement" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_stagiaire" uuid,
	"id_universite" uuid NOT NULL,
	"email_cible" varchar(255),
	"statut" "statut_rattachement_universitaire" DEFAULT 'en_attente' NOT NULL,
	"source" "source_rattachement_universitaire" NOT NULL,
	"token_hash" varchar(64),
	"date_demande" timestamp with time zone DEFAULT now(),
	"date_confirmation" timestamp with time zone,
	"date_refus" timestamp with time zone,
	"confirme_par" uuid,
	"date_expiration" timestamp with time zone,
	"date_creation" timestamp with time zone DEFAULT now(),
	"date_maj" timestamp with time zone DEFAULT now(),
	CONSTRAINT "rattachements_universitaires_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "activites_equipe" ALTER COLUMN "date_action" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "activites_equipe" ALTER COLUMN "date_action" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "affectations_superviseur_stage" ALTER COLUMN "date_affectation" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "affectations_superviseur_stage" ALTER COLUMN "date_affectation" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "alertes_securite" ALTER COLUMN "date_creation" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "alertes_securite" ALTER COLUMN "date_creation" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "alertes_securite" ALTER COLUMN "date_maj" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "alertes_securite" ALTER COLUMN "date_maj" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "alertes_securite" ALTER COLUMN "date_derniere_detection" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "alertes_securite" ALTER COLUMN "date_derniere_detection" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "alertes_securite" ALTER COLUMN "date_examen" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "alertes_securite" ALTER COLUMN "date_resolution" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "badges" ALTER COLUMN "date_obtention" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "badges" ALTER COLUMN "date_obtention" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "candidatures" ALTER COLUMN "date_candidature" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "candidatures" ALTER COLUMN "date_candidature" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "candidatures" ALTER COLUMN "date_maj_statut" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "candidatures" ALTER COLUMN "date_maj_statut" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "candidatures" ALTER COLUMN "date_retrait" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "certificats" ALTER COLUMN "date_emission" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "certificats" ALTER COLUMN "date_emission" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "coaching_ia_sessions" ALTER COLUMN "date_generation" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "coaching_ia_sessions" ALTER COLUMN "date_generation" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "competences_acquises_stage" ALTER COLUMN "date_acquisition" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "competences_acquises_stage" ALTER COLUMN "date_acquisition" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "conventions_stage" ALTER COLUMN "date_acceptation_entreprise" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "conventions_stage" ALTER COLUMN "date_acceptation_stagiaire" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "conventions_stage" ALTER COLUMN "date_validation_universite" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "conventions_stage" ALTER COLUMN "date_creation" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "conventions_stage" ALTER COLUMN "date_creation" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "date_creation" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "date_creation" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "date_upload" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "date_upload" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "entreprises" ALTER COLUMN "date_verification" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "entreprises" ALTER COLUMN "date_creation" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "entreprises" ALTER COLUMN "date_creation" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "entretiens" ALTER COLUMN "date_heure" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "entretiens" ALTER COLUMN "date_heure_proposee" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "entretiens" ALTER COLUMN "date_creation" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "entretiens" ALTER COLUMN "date_creation" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "evaluations_candidature" ALTER COLUMN "date_maj" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "evaluations_candidature" ALTER COLUMN "date_maj" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "evaluations_hebdomadaires" ALTER COLUMN "date_soumission" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "favoris_offres" ALTER COLUMN "date_ajout" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "favoris_offres" ALTER COLUMN "date_ajout" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "journal_actions_admin" ALTER COLUMN "date_creation" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "journal_actions_admin" ALTER COLUMN "date_creation" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "journal_stage" ALTER COLUMN "date_validation" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "journal_stage" ALTER COLUMN "date_creation" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "journal_stage" ALTER COLUMN "date_creation" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "litiges_messages" ALTER COLUMN "date_creation" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "litiges_messages" ALTER COLUMN "date_creation" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "litiges_notes_internes" ALTER COLUMN "date_creation" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "litiges_notes_internes" ALTER COLUMN "date_creation" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "litiges_pieces_jointes" ALTER COLUMN "date_upload" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "litiges_pieces_jointes" ALTER COLUMN "date_upload" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "litiges_reclamations" ALTER COLUMN "date_creation" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "litiges_reclamations" ALTER COLUMN "date_creation" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "litiges_reclamations" ALTER COLUMN "date_resolution" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "litiges_reclamations" ALTER COLUMN "date_escalade" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "membres_equipe" ALTER COLUMN "date_envoi_invitation" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "membres_equipe" ALTER COLUMN "date_envoi_invitation" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "membres_equipe" ALTER COLUMN "date_expiration_invitation" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "membres_equipe" ALTER COLUMN "date_activation" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "membres_equipe" ALTER COLUMN "date_desactivation" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "membres_equipe" ALTER COLUMN "date_creation" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "membres_equipe" ALTER COLUMN "date_creation" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "date_envoi" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "date_envoi" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "notes_candidature" ALTER COLUMN "date_creation" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "notes_candidature" ALTER COLUMN "date_creation" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "date_creation" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "date_creation" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "objectifs_stage" ALTER COLUMN "date_creation" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "objectifs_stage" ALTER COLUMN "date_creation" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "objectifs_stage" ALTER COLUMN "date_realisation" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "observations_superviseur_stage" ALTER COLUMN "date_creation" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "observations_superviseur_stage" ALTER COLUMN "date_creation" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "offres_finales" ALTER COLUMN "date_validation" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "offres_finales" ALTER COLUMN "date_reponse_stagiaire" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "offres_finales" ALTER COLUMN "date_creation" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "offres_finales" ALTER COLUMN "date_creation" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "offres_stage" ALTER COLUMN "date_publication" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "offres_stage" ALTER COLUMN "date_creation" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "offres_stage" ALTER COLUMN "date_creation" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "parametres_plateforme" ALTER COLUMN "maintenance_debut" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "parametres_plateforme" ALTER COLUMN "maintenance_fin" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "parametres_plateforme" ALTER COLUMN "date_maj" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "parametres_plateforme" ALTER COLUMN "date_maj" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "partenariats_universite_entreprise" ALTER COLUMN "date_envoi" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "partenariats_universite_entreprise" ALTER COLUMN "date_envoi" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "partenariats_universite_entreprise" ALTER COLUMN "date_reponse" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "preferences_notifications_entreprise" ALTER COLUMN "date_creation" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "preferences_notifications_entreprise" ALTER COLUMN "date_creation" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "preferences_notifications_entreprise" ALTER COLUMN "date_maj" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "preferences_notifications_entreprise" ALTER COLUMN "date_maj" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "propositions_stage" ALTER COLUMN "date_creation" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "propositions_stage" ALTER COLUMN "date_creation" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "propositions_stage" ALTER COLUMN "date_vue" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "propositions_stage" ALTER COLUMN "date_reponse" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "recommandations" ALTER COLUMN "date_creation" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "recommandations" ALTER COLUMN "date_creation" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "ressources_consultees" ALTER COLUMN "date_consultation" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "ressources_consultees" ALTER COLUMN "date_consultation" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "sessions_utilisateur" ALTER COLUMN "date_expiration" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sessions_utilisateur" ALTER COLUMN "date_creation" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sessions_utilisateur" ALTER COLUMN "date_creation" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "sse_tickets" ALTER COLUMN "date_expiration" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sse_tickets" ALTER COLUMN "date_utilisation" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sse_tickets" ALTER COLUMN "date_creation" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sse_tickets" ALTER COLUMN "date_creation" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "stages" ALTER COLUMN "date_creation" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "stages" ALTER COLUMN "date_creation" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "stagiaires" ALTER COLUMN "date_creation" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "stagiaires" ALTER COLUMN "date_creation" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "taches_stage" ALTER COLUMN "date_creation" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "taches_stage" ALTER COLUMN "date_creation" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "taches_stage" ALTER COLUMN "date_completion" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tentatives_connexion" ALTER COLUMN "date_creation" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tentatives_connexion" ALTER COLUMN "date_creation" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "universites" ALTER COLUMN "date_verification" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "universites" ALTER COLUMN "date_creation" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "universites" ALTER COLUMN "date_creation" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "utilisateurs" ALTER COLUMN "derniere_connexion" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "utilisateurs" ALTER COLUMN "date_creation" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "utilisateurs" ALTER COLUMN "date_creation" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "utilisateurs" ALTER COLUMN "date_maj" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "utilisateurs" ALTER COLUMN "date_maj" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "verifications_email" ALTER COLUMN "date_expiration" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "offres_finales" ADD COLUMN "horaires_stage" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "offres_stage" ADD COLUMN "lien_reunion_online" text;--> statement-breakpoint
ALTER TABLE "offres_stage" ADD COLUMN "remuneration_options" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "stagiaires" ADD COLUMN "experiences_professionnelles" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "stagiaires" ADD COLUMN "qualites" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "codes_rattachement_universite" ADD CONSTRAINT "codes_rattachement_universite_id_universite_universites_id_universite_fk" FOREIGN KEY ("id_universite") REFERENCES "public"."universites"("id_universite") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_rattachements_universitaire" ADD CONSTRAINT "journal_rattachements_universitaire_id_universite_universites_id_universite_fk" FOREIGN KEY ("id_universite") REFERENCES "public"."universites"("id_universite") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_rattachements_universitaire" ADD CONSTRAINT "journal_rattachements_universitaire_id_rattachement_rattachements_universitaires_id_rattachement_fk" FOREIGN KEY ("id_rattachement") REFERENCES "public"."rattachements_universitaires"("id_rattachement") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_rattachements_universitaire" ADD CONSTRAINT "journal_rattachements_universitaire_id_stagiaire_stagiaires_id_stagiaire_fk" FOREIGN KEY ("id_stagiaire") REFERENCES "public"."stagiaires"("id_stagiaire") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_rattachements_universitaire" ADD CONSTRAINT "journal_rattachements_universitaire_id_utilisateur_acteur_utilisateurs_id_utilisateur_fk" FOREIGN KEY ("id_utilisateur_acteur") REFERENCES "public"."utilisateurs"("id_utilisateur") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "liens_rattachement_universite" ADD CONSTRAINT "liens_rattachement_universite_id_universite_universites_id_universite_fk" FOREIGN KEY ("id_universite") REFERENCES "public"."universites"("id_universite") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rattachements_universitaires" ADD CONSTRAINT "rattachements_universitaires_id_stagiaire_stagiaires_id_stagiaire_fk" FOREIGN KEY ("id_stagiaire") REFERENCES "public"."stagiaires"("id_stagiaire") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rattachements_universitaires" ADD CONSTRAINT "rattachements_universitaires_id_universite_universites_id_universite_fk" FOREIGN KEY ("id_universite") REFERENCES "public"."universites"("id_universite") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rattachements_universitaires" ADD CONSTRAINT "rattachements_universitaires_confirme_par_utilisateurs_id_utilisateur_fk" FOREIGN KEY ("confirme_par") REFERENCES "public"."utilisateurs"("id_utilisateur") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_code_rattachement_actif_universite" ON "codes_rattachement_universite" USING btree ("id_universite") WHERE actif = true;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_lien_rattachement_actif_universite" ON "liens_rattachement_universite" USING btree ("id_universite") WHERE actif = true;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_rattachement_universitaire_email_attente" ON "rattachements_universitaires" USING btree ("id_universite","email_cible") WHERE statut = 'en_attente' AND email_cible IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_rattachement_universitaire_actif_stagiaire" ON "rattachements_universitaires" USING btree ("id_stagiaire") WHERE id_stagiaire IS NOT NULL AND statut IN ('en_attente', 'confirme');--> statement-breakpoint
CREATE INDEX "ix_rattachement_universitaire_universite_statut" ON "rattachements_universitaires" USING btree ("id_universite","statut","date_creation");