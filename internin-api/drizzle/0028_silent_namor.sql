CREATE TABLE "journal_actions_admin" (
	"id_journal" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_admin" uuid NOT NULL,
	"type_entite" varchar(50) NOT NULL,
	"id_entite" uuid NOT NULL,
	"action" varchar(80) NOT NULL,
	"ancien_statut" varchar(50),
	"nouveau_statut" varchar(50),
	"motif" text,
	"commentaire" text,
	"date_creation" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "entreprises" ADD COLUMN "motif_rejet_verification" text;--> statement-breakpoint
ALTER TABLE "journal_actions_admin" ADD CONSTRAINT "journal_actions_admin_id_admin_administrateurs_id_admin_fk" FOREIGN KEY ("id_admin") REFERENCES "public"."administrateurs"("id_admin") ON DELETE no action ON UPDATE no action;