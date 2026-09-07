CREATE TABLE IF NOT EXISTS "favoris_offres" (
  "id_favori" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "id_stagiaire" uuid NOT NULL,
  "id_offre" uuid NOT NULL,
  "date_ajout" timestamp DEFAULT now(),
  CONSTRAINT "favoris_offres_id_stagiaire_stagiaires_id_stagiaire_fk"
    FOREIGN KEY ("id_stagiaire") REFERENCES "public"."stagiaires"("id_stagiaire") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "favoris_offres_id_offre_offres_stage_id_offre_fk"
    FOREIGN KEY ("id_offre") REFERENCES "public"."offres_stage"("id_offre") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_favori_stagiaire_offre"
  ON "favoris_offres" USING btree ("id_stagiaire","id_offre");
