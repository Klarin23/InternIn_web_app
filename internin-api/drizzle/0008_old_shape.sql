ALTER TABLE "utilisateurs" ADD COLUMN "validee_par_universite" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "utilisateurs" ADD COLUMN "date_validation_universite" timestamp;