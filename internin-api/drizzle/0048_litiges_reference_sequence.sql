-- Références de litiges : séquence atomique + restauration contrainte UNIQUE
-- (supprimée par 0041_milky_nebula). Remplace COUNT(*)+1 vulnérable aux courses.

CREATE SEQUENCE IF NOT EXISTS "litiges_reference_seq";

-- Aligner la séquence sur le max existant pour ne pas regénérer d'anciens numéros
SELECT setval(
  'litiges_reference_seq',
  GREATEST(
    COALESCE(
      (
        SELECT MAX(
          (substring(reference from 'RPT-[0-9]{4}-([0-9]+)$'))::integer
        )
        FROM "litiges_reclamations"
        WHERE reference ~ '^RPT-[0-9]{4}-[0-9]+$'
      ),
      0
    ),
    0
  ),
  true
);

-- Dédoublonnage défensif (conserve la plus ancienne ligne par référence)
WITH duplicates AS (
  SELECT
    id_litige,
    reference,
    row_number() OVER (
      PARTITION BY reference
      ORDER BY date_creation NULLS FIRST, id_litige
    ) AS occurrence
  FROM "litiges_reclamations"
  WHERE reference IS NOT NULL
),
max_num AS (
  SELECT COALESCE(
    MAX((substring(reference from 'RPT-[0-9]{4}-([0-9]+)$'))::integer),
    0
  ) AS m
  FROM "litiges_reclamations"
  WHERE reference ~ '^RPT-[0-9]{4}-[0-9]+$'
),
renum AS (
  SELECT
    d.id_litige,
    (SELECT m FROM max_num)
      + row_number() OVER (ORDER BY d.id_litige) AS nouveau_numero
  FROM duplicates d
  WHERE d.occurrence > 1
)
UPDATE "litiges_reclamations" l
SET reference = 'RPT-' || EXTRACT(YEAR FROM COALESCE(l.date_creation, NOW()))::int
  || '-' || lpad(r.nouveau_numero::text, 4, '0')
FROM renum r
WHERE l.id_litige = r.id_litige;

-- Réaligner la séquence après éventuelle renumérotation
SELECT setval(
  'litiges_reference_seq',
  GREATEST(
    COALESCE(
      (
        SELECT MAX(
          (substring(reference from 'RPT-[0-9]{4}-([0-9]+)$'))::integer
        )
        FROM "litiges_reclamations"
        WHERE reference ~ '^RPT-[0-9]{4}-[0-9]+$'
      ),
      0
    ),
    0
  ),
  true
);

CREATE UNIQUE INDEX IF NOT EXISTS "litiges_reclamations_reference_unique"
  ON "litiges_reclamations" ("reference");

CREATE INDEX IF NOT EXISTS "litiges_reclamations_plaignant_idx"
  ON "litiges_reclamations" ("id_utilisateur_plaignant");
