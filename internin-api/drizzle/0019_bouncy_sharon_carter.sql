CREATE TABLE "evaluations_candidature" (
	"id_candidature" uuid PRIMARY KEY NOT NULL,
	"note_globale" smallint,
	"motivation" smallint,
	"communication" smallint,
	"technique" smallint,
	"presentation" smallint,
	"id_membre_maj" uuid,
	"date_maj" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notes_candidature" (
	"id_note" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_candidature" uuid NOT NULL,
	"id_membre" uuid,
	"contenu" text NOT NULL,
	"date_creation" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "activites_equipe" ADD COLUMN "id_candidature" uuid;--> statement-breakpoint
ALTER TABLE "evaluations_candidature" ADD CONSTRAINT "evaluations_candidature_id_candidature_candidatures_id_candidature_fk" FOREIGN KEY ("id_candidature") REFERENCES "public"."candidatures"("id_candidature") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluations_candidature" ADD CONSTRAINT "evaluations_candidature_id_membre_maj_membres_equipe_id_membre_fk" FOREIGN KEY ("id_membre_maj") REFERENCES "public"."membres_equipe"("id_membre") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes_candidature" ADD CONSTRAINT "notes_candidature_id_candidature_candidatures_id_candidature_fk" FOREIGN KEY ("id_candidature") REFERENCES "public"."candidatures"("id_candidature") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes_candidature" ADD CONSTRAINT "notes_candidature_id_membre_membres_equipe_id_membre_fk" FOREIGN KEY ("id_membre") REFERENCES "public"."membres_equipe"("id_membre") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activites_equipe" ADD CONSTRAINT "activites_equipe_id_candidature_candidatures_id_candidature_fk" FOREIGN KEY ("id_candidature") REFERENCES "public"."candidatures"("id_candidature") ON DELETE no action ON UPDATE no action;