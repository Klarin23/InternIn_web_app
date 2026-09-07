CREATE TABLE IF NOT EXISTS "favoris_offres" (
	"id_favori" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_stagiaire" uuid NOT NULL,
	"id_offre" uuid NOT NULL,
	"date_ajout" timestamp DEFAULT now(),
	CONSTRAINT "uq_favori_stagiaire_offre" UNIQUE("id_stagiaire","id_offre")
);
--> statement-breakpoint
ALTER TABLE "propositions_stage" ADD COLUMN IF NOT EXISTS "commentaire_reponse" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "favoris_offres" ADD CONSTRAINT "favoris_offres_id_stagiaire_stagiaires_id_stagiaire_fk" FOREIGN KEY ("id_stagiaire") REFERENCES "public"."stagiaires"("id_stagiaire") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "favoris_offres" ADD CONSTRAINT "favoris_offres_id_offre_offres_stage_id_offre_fk" FOREIGN KEY ("id_offre") REFERENCES "public"."offres_stage"("id_offre") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
