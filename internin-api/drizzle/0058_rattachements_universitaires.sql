CREATE TYPE "public"."statut_rattachement_universitaire" AS ENUM('en_attente', 'confirme', 'refuse', 'expire', 'annule');
CREATE TYPE "public"."source_rattachement_universitaire" AS ENUM('invitation', 'code', 'lien', 'admin', 'import');

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
ALTER TABLE "rattachements_universitaires" ADD CONSTRAINT "rattachements_universitaires_id_stagiaire_stagiaires_id_stagiaire_fk" FOREIGN KEY ("id_stagiaire") REFERENCES "public"."stagiaires"("id_stagiaire") ON DELETE set null ON UPDATE no action;
ALTER TABLE "rattachements_universitaires" ADD CONSTRAINT "rattachements_universitaires_id_universite_universites_id_universite_fk" FOREIGN KEY ("id_universite") REFERENCES "public"."universites"("id_universite") ON DELETE no action ON UPDATE no action;
ALTER TABLE "rattachements_universitaires" ADD CONSTRAINT "rattachements_universitaires_confirme_par_utilisateurs_id_utilisateur_fk" FOREIGN KEY ("confirme_par") REFERENCES "public"."utilisateurs"("id_utilisateur") ON DELETE set null ON UPDATE no action;
ALTER TABLE "codes_rattachement_universite" ADD CONSTRAINT "codes_rattachement_universite_id_universite_universites_id_universite_fk" FOREIGN KEY ("id_universite") REFERENCES "public"."universites"("id_universite") ON DELETE no action ON UPDATE no action;
ALTER TABLE "liens_rattachement_universite" ADD CONSTRAINT "liens_rattachement_universite_id_universite_universites_id_universite_fk" FOREIGN KEY ("id_universite") REFERENCES "public"."universites"("id_universite") ON DELETE no action ON UPDATE no action;
ALTER TABLE "journal_rattachements_universitaire" ADD CONSTRAINT "journal_rattachements_universitaire_id_universite_universites_id_universite_fk" FOREIGN KEY ("id_universite") REFERENCES "public"."universites"("id_universite") ON DELETE no action ON UPDATE no action;
ALTER TABLE "journal_rattachements_universitaire" ADD CONSTRAINT "journal_rattachements_universitaire_id_rattachement_rattachements_universitaires_id_rattachement_fk" FOREIGN KEY ("id_rattachement") REFERENCES "public"."rattachements_universitaires"("id_rattachement") ON DELETE set null ON UPDATE no action;
ALTER TABLE "journal_rattachements_universitaire" ADD CONSTRAINT "journal_rattachements_universitaire_id_stagiaire_stagiaires_id_stagiaire_fk" FOREIGN KEY ("id_stagiaire") REFERENCES "public"."stagiaires"("id_stagiaire") ON DELETE set null ON UPDATE no action;
ALTER TABLE "journal_rattachements_universitaire" ADD CONSTRAINT "journal_rattachements_universitaire_id_utilisateur_acteur_utilisateurs_id_utilisateur_fk" FOREIGN KEY ("id_utilisateur_acteur") REFERENCES "public"."utilisateurs"("id_utilisateur") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_rattachement_universitaire_email_attente" ON "rattachements_universitaires" USING btree ("id_universite","email_cible") WHERE statut = 'en_attente' AND email_cible IS NOT NULL;
CREATE INDEX "ix_rattachement_universitaire_universite_statut" ON "rattachements_universitaires" USING btree ("id_universite","statut","date_creation");
CREATE UNIQUE INDEX "uq_rattachement_universitaire_actif_stagiaire" ON "rattachements_universitaires" USING btree ("id_stagiaire") WHERE id_stagiaire IS NOT NULL AND statut IN ('en_attente','confirme');
CREATE UNIQUE INDEX "uq_code_rattachement_actif_universite" ON "codes_rattachement_universite" USING btree ("id_universite") WHERE actif = true;
CREATE UNIQUE INDEX "uq_lien_rattachement_actif_universite" ON "liens_rattachement_universite" USING btree ("id_universite") WHERE actif = true;
