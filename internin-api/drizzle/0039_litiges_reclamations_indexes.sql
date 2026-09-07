-- Indexes complémentaires du système Safety & Reporting.
-- La migration 0038_luxuriant_human_robot est la migration officielle
-- qui ajoute les colonnes du module. Cette migration ajoute uniquement
-- les contraintes/indexes manquants et ne ré-applique aucune colonne.

-- Si une ancienne exécution concurrente a déjà créé des références
-- identiques, on conserve la première et on renumérote uniquement les
-- doublons au format RPT-YYYY-NNNN avant de poser la contrainte UNIQUE.
WITH duplicates AS (
  SELECT
    id_litige,
    reference,
    substring(reference from '^RPT-([0-9]{4})-') AS annee,
    row_number() OVER (
      PARTITION BY reference
      ORDER BY date_creation NULLS FIRST, id_litige
    ) AS occurrence
  FROM "litiges_reclamations"
  WHERE reference IS NOT NULL
),
max_by_year AS (
  SELECT
    substring(reference from '^RPT-([0-9]{4})-') AS annee,
    COALESCE(
      MAX((substring(reference from '^RPT-[0-9]{4}-([0-9]+)$'))::integer),
      0
    ) AS max_numero
  FROM "litiges_reclamations"
  WHERE reference ~ '^RPT-[0-9]{4}-[0-9]+$'
  GROUP BY substring(reference from '^RPT-([0-9]{4})-')
),
doublons_a_renumeroter AS (
  SELECT
    d.id_litige,
    d.annee,
    m.max_numero + row_number() OVER (
      PARTITION BY d.annee
      ORDER BY d.id_litige
    ) AS nouveau_numero
  FROM duplicates d
  INNER JOIN max_by_year m ON m.annee = d.annee
  WHERE d.occurrence > 1
    AND d.annee IS NOT NULL
)
UPDATE "litiges_reclamations" l
SET reference = 'RPT-' || d.annee || '-' || lpad(d.nouveau_numero::text, 4, '0')
FROM doublons_a_renumeroter d
WHERE l.id_litige = d.id_litige;

CREATE UNIQUE INDEX IF NOT EXISTS "litiges_reclamations_reference_unique"
  ON "litiges_reclamations" ("reference");

CREATE INDEX IF NOT EXISTS "litiges_reclamations_plaignant_idx"
  ON "litiges_reclamations" ("id_utilisateur_plaignant");
