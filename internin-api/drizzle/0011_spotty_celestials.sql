ALTER TABLE "notifications" ALTER COLUMN "titre" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "type" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "message" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "lien" varchar(255);--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "lu" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN "type_notification";--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN "contenu";--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN "lien_action";--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN "canal";--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN "statut_lecture";