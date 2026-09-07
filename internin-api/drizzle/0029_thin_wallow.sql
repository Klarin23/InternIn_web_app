ALTER TABLE "journal_actions_admin" DROP CONSTRAINT "journal_actions_admin_id_admin_administrateurs_id_admin_fk";
--> statement-breakpoint
ALTER TABLE "journal_actions_admin" ALTER COLUMN "id_entite" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "journal_actions_admin" ALTER COLUMN "action" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "parametres_plateforme" ALTER COLUMN "double_authentification" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "journal_actions_admin" ADD COLUMN "id_administrateur" uuid;--> statement-breakpoint
ALTER TABLE "parametres_plateforme" ADD COLUMN "mode_maintenance" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "parametres_plateforme" ADD COLUMN "message_maintenance" text;--> statement-breakpoint
ALTER TABLE "parametres_plateforme" ADD COLUMN "maintenance_debut" timestamp;--> statement-breakpoint
ALTER TABLE "parametres_plateforme" ADD COLUMN "maintenance_fin" timestamp;--> statement-breakpoint
ALTER TABLE "parametres_plateforme" ADD COLUMN "admins_peuvent_acceder" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "journal_actions_admin" ADD CONSTRAINT "journal_actions_admin_id_administrateur_utilisateurs_id_utilisateur_fk" FOREIGN KEY ("id_administrateur") REFERENCES "public"."utilisateurs"("id_utilisateur") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entreprises" DROP COLUMN "motif_rejet_verification";--> statement-breakpoint
ALTER TABLE "journal_actions_admin" DROP COLUMN "id_admin";--> statement-breakpoint
ALTER TABLE "journal_actions_admin" DROP COLUMN "commentaire";