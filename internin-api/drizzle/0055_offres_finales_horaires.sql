-- Planning hebdomadaire convenu et envoyé avec l'offre finale.
-- Les offres déjà présentes restent compatibles avec un tableau vide.
ALTER TABLE offres_finales
  ADD COLUMN IF NOT EXISTS horaires_stage jsonb NOT NULL DEFAULT '[]'::jsonb;