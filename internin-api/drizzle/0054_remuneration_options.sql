-- Stockage des différents types de rémunération sélectionnés pour une offre.
-- Compatible avec les offres existantes : elles reçoivent un tableau JSON vide.
ALTER TABLE offres_stage
  ADD COLUMN IF NOT EXISTS remuneration_options jsonb NOT NULL DEFAULT '[]'::jsonb;
