CREATE TABLE "tentatives_connexion" (
	"id_tentative" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"id_utilisateur" uuid,
	"adresse_ip" varchar(45),
	"motif" varchar(80) DEFAULT 'identifiants_invalides' NOT NULL,
	"date_creation" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "tentatives_connexion" ADD CONSTRAINT "tentatives_connexion_id_utilisateur_utilisateurs_id_utilisateur_fk" FOREIGN KEY ("id_utilisateur") REFERENCES "public"."utilisateurs"("id_utilisateur") ON DELETE no action ON UPDATE no action;