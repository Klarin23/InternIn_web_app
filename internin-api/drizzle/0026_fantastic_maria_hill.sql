CREATE TABLE "sse_tickets" (
	"id_ticket" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_utilisateur" uuid NOT NULL,
	"ticket_hash" varchar(64) NOT NULL,
	"date_expiration" timestamp NOT NULL,
	"date_utilisation" timestamp,
	"date_creation" timestamp DEFAULT now(),
	CONSTRAINT "sse_tickets_ticket_hash_unique" UNIQUE("ticket_hash")
);
--> statement-breakpoint
ALTER TABLE "sse_tickets" ADD CONSTRAINT "sse_tickets_id_utilisateur_utilisateurs_id_utilisateur_fk" FOREIGN KEY ("id_utilisateur") REFERENCES "public"."utilisateurs"("id_utilisateur") ON DELETE cascade ON UPDATE no action;