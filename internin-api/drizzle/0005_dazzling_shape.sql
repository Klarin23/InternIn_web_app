CREATE TABLE "parametres_plateforme" (
	"id_parametres" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"validation_automatique" boolean DEFAULT false NOT NULL,
	"delai_traitement_heures" integer DEFAULT 72 NOT NULL,
	"documents_requis_par_entite" integer DEFAULT 3 NOT NULL,
	"notifications_email" boolean DEFAULT true NOT NULL,
	"double_authentification" boolean DEFAULT true NOT NULL,
	"date_maj" timestamp DEFAULT now()
);
