-- Préférences de notifications entreprise (persistance BDD, hors localStorage)
CREATE TABLE IF NOT EXISTS "preferences_notifications_entreprise" (
  "id_preference" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "id_entreprise" uuid NOT NULL,
  "messages" boolean DEFAULT true NOT NULL,
  "candidatures" boolean DEFAULT true NOT NULL,
  "evaluations" boolean DEFAULT true NOT NULL,
  "equipe" boolean DEFAULT true NOT NULL,
  "date_creation" timestamp DEFAULT now(),
  "date_maj" timestamp DEFAULT now(),
  CONSTRAINT "preferences_notifications_entreprise_id_entreprise_unique" UNIQUE("id_entreprise")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "preferences_notifications_entreprise" ADD CONSTRAINT "preferences_notifications_entreprise_id_entreprise_entreprises_id_entreprise_fk" FOREIGN KEY ("id_entreprise") REFERENCES "public"."entreprises"("id_entreprise") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
