-- Alertes de sécurité Admin (persistantes, dédupliquées)
DO $$ BEGIN
  CREATE TYPE "public"."gravite_alerte_securite" AS ENUM('information', 'attention', 'important', 'critique');
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."statut_alerte_securite" AS ENUM('nouvelle', 'examinee', 'en_cours', 'resolue');
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alertes_securite" (
  "id_alerte" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "fingerprint" varchar(191) NOT NULL,
  "type_alerte" varchar(80) NOT NULL,
  "gravite" "gravite_alerte_securite" NOT NULL DEFAULT 'attention',
  "statut" "statut_alerte_securite" NOT NULL DEFAULT 'nouvelle',
  "titre" varchar(255) NOT NULL,
  "description" text,
  "id_utilisateur_cible" uuid REFERENCES "utilisateurs"("id_utilisateur"),
  "email_cible" varchar(255),
  "nom_cible" varchar(255),
  "niveau_detection" varchar(50),
  "score_global" integer DEFAULT 0,
  "score_partage" integer DEFAULT 0,
  "score_automatisation" integer DEFAULT 0,
  "score_authentification" integer DEFAULT 0,
  "signaux" jsonb DEFAULT '[]'::jsonb,
  "nb_evenements" integer NOT NULL DEFAULT 1,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "date_creation" timestamp DEFAULT now(),
  "date_maj" timestamp DEFAULT now(),
  "date_derniere_detection" timestamp DEFAULT now(),
  "date_examen" timestamp,
  "date_resolution" timestamp,
  "id_admin_resolution" uuid REFERENCES "utilisateurs"("id_utilisateur"),
  "notifie" boolean NOT NULL DEFAULT false
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "alertes_securite_fingerprint_uidx" ON "alertes_securite" ("fingerprint");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alertes_securite_statut_idx" ON "alertes_securite" ("statut");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alertes_securite_gravite_idx" ON "alertes_securite" ("gravite");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alertes_securite_date_idx" ON "alertes_securite" ("date_derniere_detection");
