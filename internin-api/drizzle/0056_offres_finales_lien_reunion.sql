-- Lien HTTPS de réunion communiqué au stagiaire pour les offres à distance.
ALTER TABLE offres_finales
  ADD COLUMN IF NOT EXISTS lien_reunion_online text;