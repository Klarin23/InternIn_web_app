ALTER TABLE "conventions_stage" ADD COLUMN "date_validation_universite" timestamp;--> statement-breakpoint
ALTER TABLE "utilisateurs" DROP COLUMN "validee_par_universite";--> statement-breakpoint
ALTER TABLE "utilisateurs" DROP COLUMN "date_validation_universite";