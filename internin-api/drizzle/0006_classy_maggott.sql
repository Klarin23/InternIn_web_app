CREATE TYPE "public"."statut_partenariat" AS ENUM('en_attente', 'acceptee', 'refusee');--> statement-breakpoint
CREATE TABLE "partenariats_universite_entreprise" (
	"id_partenariat" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_universite" uuid NOT NULL,
	"id_entreprise" uuid NOT NULL,
	"statut" "statut_partenariat" DEFAULT 'en_attente' NOT NULL,
	"message_invitation" text,
	"date_envoi" timestamp DEFAULT now(),
	"date_reponse" timestamp,
	CONSTRAINT "partenariats_universite_entreprise_id_universite_id_entreprise_unique" UNIQUE("id_universite","id_entreprise")
);
--> statement-breakpoint
ALTER TABLE "partenariats_universite_entreprise" ADD CONSTRAINT "partenariats_universite_entreprise_id_universite_universites_id_universite_fk" FOREIGN KEY ("id_universite") REFERENCES "public"."universites"("id_universite") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partenariats_universite_entreprise" ADD CONSTRAINT "partenariats_universite_entreprise_id_entreprise_entreprises_id_entreprise_fk" FOREIGN KEY ("id_entreprise") REFERENCES "public"."entreprises"("id_entreprise") ON DELETE no action ON UPDATE no action;