CREATE TYPE "public"."gravite_alerte_securite" AS ENUM('information', 'attention', 'important', 'critique');--> statement-breakpoint
CREATE TYPE "public"."statut_alerte_securite" AS ENUM('nouvelle', 'examinee', 'en_cours', 'resolue');--> statement-breakpoint
CREATE TABLE "alertes_securite" (
	"id_alerte" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fingerprint" varchar(191) NOT NULL,
	"type_alerte" varchar(80) NOT NULL,
	"gravite" "gravite_alerte_securite" DEFAULT 'attention' NOT NULL,
	"statut" "statut_alerte_securite" DEFAULT 'nouvelle' NOT NULL,
	"titre" varchar(255) NOT NULL,
	"description" text,
	"id_utilisateur_cible" uuid,
	"email_cible" varchar(255),
	"nom_cible" varchar(255),
	"niveau_detection" varchar(50),
	"score_global" integer DEFAULT 0,
	"score_partage" integer DEFAULT 0,
	"score_automatisation" integer DEFAULT 0,
	"score_authentification" integer DEFAULT 0,
	"signaux" jsonb DEFAULT '[]'::jsonb,
	"nb_evenements" integer DEFAULT 1 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"date_creation" timestamp DEFAULT now(),
	"date_maj" timestamp DEFAULT now(),
	"date_derniere_detection" timestamp DEFAULT now(),
	"date_examen" timestamp,
	"date_resolution" timestamp,
	"id_admin_resolution" uuid,
	"notifie" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alertes_securite" ADD CONSTRAINT "alertes_securite_id_utilisateur_cible_utilisateurs_id_utilisateur_fk" FOREIGN KEY ("id_utilisateur_cible") REFERENCES "public"."utilisateurs"("id_utilisateur") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alertes_securite" ADD CONSTRAINT "alertes_securite_id_admin_resolution_utilisateurs_id_utilisateur_fk" FOREIGN KEY ("id_admin_resolution") REFERENCES "public"."utilisateurs"("id_utilisateur") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "alertes_securite_fingerprint_uidx" ON "alertes_securite" USING btree ("fingerprint");