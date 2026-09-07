ALTER TABLE "stagiaires" ADD COLUMN "profil_visible_entreprises" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE TYPE "public"."statut_proposition_stage" AS ENUM('envoyee', 'vue', 'acceptee', 'refusee', 'expiree', 'annulee');--> statement-breakpoint
CREATE TABLE "propositions_stage" (
	"id_proposition" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_entreprise" uuid NOT NULL,
	"id_stagiaire" uuid NOT NULL,
	"id_offre" uuid NOT NULL,
	"message" text,
	"statut" "statut_proposition_stage" DEFAULT 'envoyee' NOT NULL,
	"date_creation" timestamp DEFAULT now(),
	"date_vue" timestamp,
	"date_reponse" timestamp
);
--> statement-breakpoint
ALTER TABLE "propositions_stage" ADD CONSTRAINT "propositions_stage_id_entreprise_entreprises_id_entreprise_fk" FOREIGN KEY ("id_entreprise") REFERENCES "public"."entreprises"("id_entreprise") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "propositions_stage" ADD CONSTRAINT "propositions_stage_id_stagiaire_stagiaires_id_stagiaire_fk" FOREIGN KEY ("id_stagiaire") REFERENCES "public"."stagiaires"("id_stagiaire") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "propositions_stage" ADD CONSTRAINT "propositions_stage_id_offre_offres_stage_id_offre_fk" FOREIGN KEY ("id_offre") REFERENCES "public"."offres_stage"("id_offre") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "propositions_stage" ADD CONSTRAINT "uq_proposition_entreprise_stagiaire_offre" UNIQUE("id_entreprise","id_stagiaire","id_offre");
