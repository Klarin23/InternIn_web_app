-- Séparation messagerie entreprise / superviseur
-- 1 stage peut avoir 1 conversation entreprise + N conversations superviseur

CREATE TYPE "public"."type_conversation" AS ENUM('entreprise', 'superviseur');

ALTER TABLE "conversations" ADD COLUMN "type_conversation" "type_conversation" DEFAULT 'entreprise' NOT NULL;
ALTER TABLE "conversations" ADD COLUMN "id_entreprise" uuid;
ALTER TABLE "conversations" ADD COLUMN "id_membre_entreprise" uuid;

-- Backfill : conversations historiques = boîte entreprise
UPDATE "conversations" c
SET
  "type_conversation" = 'entreprise',
  "id_entreprise" = s."id_entreprise"
FROM "stages" s
WHERE c."id_stage" = s."id_stage";

ALTER TABLE "conversations"
  ADD CONSTRAINT "conversations_id_entreprise_entreprises_id_entreprise_fk"
  FOREIGN KEY ("id_entreprise") REFERENCES "public"."entreprises"("id_entreprise")
  ON DELETE no action ON UPDATE no action;

ALTER TABLE "conversations"
  ADD CONSTRAINT "conversations_id_membre_entreprise_membres_equipe_id_membre_fk"
  FOREIGN KEY ("id_membre_entreprise") REFERENCES "public"."membres_equipe"("id_membre")
  ON DELETE no action ON UPDATE no action;

-- Supprimer l'ancienne contrainte 1 stage = 1 conversation
ALTER TABLE "conversations" DROP CONSTRAINT IF EXISTS "conversations_id_stage_unique";
DROP INDEX IF EXISTS "conversations_id_stage_unique";

-- Nouvelles contraintes d'unicité (partielles, adaptées aux NULL PostgreSQL)
CREATE UNIQUE INDEX IF NOT EXISTS "uq_conversations_entreprise_stage"
  ON "conversations" ("id_stage")
  WHERE "type_conversation" = 'entreprise';

CREATE UNIQUE INDEX IF NOT EXISTS "uq_conversations_superviseur_stage_membre"
  ON "conversations" ("id_stage", "id_membre_entreprise")
  WHERE "type_conversation" = 'superviseur';

-- Créer les conversations superviseur manquantes pour les affectations existantes
-- (sans dupliquer les messages historiques)
INSERT INTO "conversations" (
  "id_stage",
  "type_conversation",
  "id_entreprise",
  "id_membre_entreprise",
  "statut"
)
SELECT
  a."id_stage",
  'superviseur'::"type_conversation",
  s."id_entreprise",
  a."id_membre",
  'active'::"statut_conversation"
FROM "affectations_superviseur_stage" a
INNER JOIN "stages" s ON s."id_stage" = a."id_stage"
WHERE NOT EXISTS (
  SELECT 1 FROM "conversations" c
  WHERE c."id_stage" = a."id_stage"
    AND c."type_conversation" = 'superviseur'
    AND c."id_membre_entreprise" = a."id_membre"
);
