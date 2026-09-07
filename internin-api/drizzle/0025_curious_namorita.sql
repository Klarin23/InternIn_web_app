ALTER TABLE "candidatures" ADD COLUMN "motif_retrait_code" varchar(80);--> statement-breakpoint
ALTER TABLE "candidatures" ADD COLUMN "motif_retrait_commentaire" text;--> statement-breakpoint
ALTER TABLE "candidatures" ADD COLUMN "date_retrait" timestamp;