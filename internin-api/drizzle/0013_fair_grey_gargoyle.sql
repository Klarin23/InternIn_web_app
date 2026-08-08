CREATE TYPE "public"."role_equipe" AS ENUM('administrateur_principal', 'gestionnaire_recrutement', 'superviseur', 'lecture_seule');--> statement-breakpoint
CREATE TABLE "activites_equipe" (
	"id_activite" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_entreprise" uuid NOT NULL,
	"id_membre" uuid,
	"action" varchar(255) NOT NULL,
	"details" text,
	"date_action" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "affectations_superviseur_stage" (
	"id_affectation" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_stage" uuid NOT NULL,
	"id_membre" uuid NOT NULL,
	"date_affectation" timestamp DEFAULT now(),
	CONSTRAINT "affectations_superviseur_stage_id_stage_unique" UNIQUE("id_stage")
);
--> statement-breakpoint
CREATE TABLE "membres_equipe" (
	"id_membre" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_entreprise" uuid NOT NULL,
	"id_utilisateur" uuid,
	"nom" varchar(150) NOT NULL,
	"email" varchar(255) NOT NULL,
	"role_equipe" "role_equipe" DEFAULT 'lecture_seule' NOT NULL,
	"permissions_personnalisees" jsonb,
	"est_admin_principal" boolean DEFAULT false,
	"statut_membre" "statut_invitation" DEFAULT 'invite' NOT NULL,
	"token_invitation" varchar(255),
	"date_envoi_invitation" timestamp DEFAULT now(),
	"date_expiration_invitation" timestamp,
	"nombre_renvois_invitation" smallint DEFAULT 0,
	"date_activation" timestamp,
	"date_desactivation" timestamp,
	"date_creation" timestamp DEFAULT now(),
	CONSTRAINT "membres_equipe_id_utilisateur_unique" UNIQUE("id_utilisateur")
);
--> statement-breakpoint
CREATE TABLE "parametres_equipe_entreprise" (
	"id_entreprise" uuid PRIMARY KEY NOT NULL,
	"role_par_defaut_invitation" "role_equipe" DEFAULT 'lecture_seule' NOT NULL,
	"expiration_invitation_jours" smallint DEFAULT 7 NOT NULL,
	"approbation_requise_pour_invitation" boolean DEFAULT false,
	"notifier_admin_nouvelle_activite" boolean DEFAULT true
);
--> statement-breakpoint
ALTER TABLE "activites_equipe" ADD CONSTRAINT "activites_equipe_id_entreprise_entreprises_id_entreprise_fk" FOREIGN KEY ("id_entreprise") REFERENCES "public"."entreprises"("id_entreprise") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activites_equipe" ADD CONSTRAINT "activites_equipe_id_membre_membres_equipe_id_membre_fk" FOREIGN KEY ("id_membre") REFERENCES "public"."membres_equipe"("id_membre") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affectations_superviseur_stage" ADD CONSTRAINT "affectations_superviseur_stage_id_stage_stages_id_stage_fk" FOREIGN KEY ("id_stage") REFERENCES "public"."stages"("id_stage") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affectations_superviseur_stage" ADD CONSTRAINT "affectations_superviseur_stage_id_membre_membres_equipe_id_membre_fk" FOREIGN KEY ("id_membre") REFERENCES "public"."membres_equipe"("id_membre") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membres_equipe" ADD CONSTRAINT "membres_equipe_id_entreprise_entreprises_id_entreprise_fk" FOREIGN KEY ("id_entreprise") REFERENCES "public"."entreprises"("id_entreprise") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membres_equipe" ADD CONSTRAINT "membres_equipe_id_utilisateur_utilisateurs_id_utilisateur_fk" FOREIGN KEY ("id_utilisateur") REFERENCES "public"."utilisateurs"("id_utilisateur") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parametres_equipe_entreprise" ADD CONSTRAINT "parametres_equipe_entreprise_id_entreprise_entreprises_id_entreprise_fk" FOREIGN KEY ("id_entreprise") REFERENCES "public"."entreprises"("id_entreprise") ON DELETE no action ON UPDATE no action;