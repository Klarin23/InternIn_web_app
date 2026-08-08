CREATE TYPE "public"."statut_journal_stage" AS ENUM('en_attente', 'validee', 'correction_demandee', 'terminee');--> statement-breakpoint
CREATE TYPE "public"."statut_objectif_stage" AS ENUM('defini', 'realise');--> statement-breakpoint
CREATE TYPE "public"."statut_tache_stage" AS ENUM('a_faire', 'terminee');--> statement-breakpoint
CREATE TABLE "competences_acquises_stage" (
	"id_acquisition" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_stage" uuid NOT NULL,
	"id_competence" uuid NOT NULL,
	"date_acquisition" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "journal_stage" (
	"id_entree" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_stage" uuid NOT NULL,
	"titre" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"date_activite" date NOT NULL,
	"statut_validation" "statut_journal_stage" DEFAULT 'en_attente' NOT NULL,
	"commentaire_superviseur" text,
	"id_membre_validateur" uuid,
	"date_validation" timestamp,
	"date_creation" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "objectifs_stage" (
	"id_objectif" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_stage" uuid NOT NULL,
	"description" text NOT NULL,
	"statut" "statut_objectif_stage" DEFAULT 'defini' NOT NULL,
	"date_creation" timestamp DEFAULT now(),
	"date_realisation" timestamp
);
--> statement-breakpoint
CREATE TABLE "observations_superviseur_stage" (
	"id_observation" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_stage" uuid NOT NULL,
	"id_membre" uuid NOT NULL,
	"contenu" text NOT NULL,
	"date_creation" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "taches_stage" (
	"id_tache" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_stage" uuid NOT NULL,
	"description" text NOT NULL,
	"statut" "statut_tache_stage" DEFAULT 'a_faire' NOT NULL,
	"date_creation" timestamp DEFAULT now(),
	"date_completion" timestamp
);
--> statement-breakpoint
ALTER TABLE "stages" ADD COLUMN "progression_pourcentage" smallint;--> statement-breakpoint
ALTER TABLE "competences_acquises_stage" ADD CONSTRAINT "competences_acquises_stage_id_stage_stages_id_stage_fk" FOREIGN KEY ("id_stage") REFERENCES "public"."stages"("id_stage") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competences_acquises_stage" ADD CONSTRAINT "competences_acquises_stage_id_competence_competences_id_competence_fk" FOREIGN KEY ("id_competence") REFERENCES "public"."competences"("id_competence") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_stage" ADD CONSTRAINT "journal_stage_id_stage_stages_id_stage_fk" FOREIGN KEY ("id_stage") REFERENCES "public"."stages"("id_stage") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_stage" ADD CONSTRAINT "journal_stage_id_membre_validateur_membres_equipe_id_membre_fk" FOREIGN KEY ("id_membre_validateur") REFERENCES "public"."membres_equipe"("id_membre") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "objectifs_stage" ADD CONSTRAINT "objectifs_stage_id_stage_stages_id_stage_fk" FOREIGN KEY ("id_stage") REFERENCES "public"."stages"("id_stage") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observations_superviseur_stage" ADD CONSTRAINT "observations_superviseur_stage_id_stage_stages_id_stage_fk" FOREIGN KEY ("id_stage") REFERENCES "public"."stages"("id_stage") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observations_superviseur_stage" ADD CONSTRAINT "observations_superviseur_stage_id_membre_membres_equipe_id_membre_fk" FOREIGN KEY ("id_membre") REFERENCES "public"."membres_equipe"("id_membre") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taches_stage" ADD CONSTRAINT "taches_stage_id_stage_stages_id_stage_fk" FOREIGN KEY ("id_stage") REFERENCES "public"."stages"("id_stage") ON DELETE no action ON UPDATE no action;