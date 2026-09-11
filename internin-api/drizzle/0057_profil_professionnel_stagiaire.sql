ALTER TABLE stagiaires
  ADD COLUMN IF NOT EXISTS experiences_professionnelles JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE stagiaires
  ADD COLUMN IF NOT EXISTS qualites TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
