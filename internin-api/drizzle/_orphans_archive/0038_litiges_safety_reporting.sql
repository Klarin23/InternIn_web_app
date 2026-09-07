-- Extension du système de signalements (litiges_reclamations)
-- pour le Safety & Reporting Center côté stagiaire.
-- Colonnes ajoutées de façon non destructive (nullable / default).

ALTER TABLE "litiges_reclamations"
  ADD COLUMN IF NOT EXISTS "cible_type" varchar(30),
  ADD COLUMN IF NOT EXISTS "categorie" varchar(100),
  ADD COLUMN IF NOT EXISTS "severite" varchar(20),
  ADD COLUMN IF NOT EXISTS "date_incident" date,
  ADD COLUMN IF NOT EXISTS "reference" varchar(40);

CREATE UNIQUE INDEX IF NOT EXISTS "litiges_reclamations_reference_unique"
  ON "litiges_reclamations" ("reference")
  WHERE "reference" IS NOT NULL;

-- Index utile pour la liste "mes signalements" stagiaire
CREATE INDEX IF NOT EXISTS "litiges_reclamations_plaignant_idx"
  ON "litiges_reclamations" ("id_utilisateur_plaignant");
