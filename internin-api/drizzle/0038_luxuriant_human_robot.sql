ALTER TABLE "litiges_reclamations" ADD COLUMN "cible_type" varchar(30);--> statement-breakpoint
ALTER TABLE "litiges_reclamations" ADD COLUMN "categorie" varchar(100);--> statement-breakpoint
ALTER TABLE "litiges_reclamations" ADD COLUMN "severite" varchar(20);--> statement-breakpoint
ALTER TABLE "litiges_reclamations" ADD COLUMN "date_incident" date;--> statement-breakpoint
ALTER TABLE "litiges_reclamations" ADD COLUMN "reference" varchar(40);