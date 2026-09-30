-- Convertit les anciennes dates-only en échéances de fin de journée Africa/Douala.
-- Les nouvelles valeurs sont des instants non ambigus en timestamptz.
ALTER TABLE "offres_stage"
  ALTER COLUMN "date_limite_candidature" TYPE timestamp with time zone
  USING (CASE
    WHEN "date_limite_candidature" IS NULL THEN NULL
    ELSE ("date_limite_candidature" + TIME '23:59:59.999999') AT TIME ZONE 'Africa/Douala'
  END);
