ALTER TABLE "stagiaires" ADD COLUMN "titre_professionnel" varchar(150);--> statement-breakpoint
ALTER TABLE "stagiaires" ADD COLUMN "presentation" text;--> statement-breakpoint
ALTER TABLE "stagiaires" ADD COLUMN "objectif_professionnel" text;--> statement-breakpoint
ALTER TABLE "stagiaires" ADD COLUMN "secteurs_recherches" text[];--> statement-breakpoint
ALTER TABLE "stagiaires" ADD COLUMN "villes_recherchees" text[];--> statement-breakpoint
ALTER TABLE "stagiaires" ADD COLUMN "modalites_travail_souhaitees" text[];--> statement-breakpoint
ALTER TABLE "stagiaires" ADD COLUMN "remuneration_souhaitee" "remuneration_type";