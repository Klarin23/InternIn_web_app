/**
 * Convertit les anciennes colonnes PostgreSQL `timestamp without time zone`
 * d'InternIn en `timestamptz`.
 *
 * IMPORTANT: une colonne sans fuseau ne permet pas de savoir quel fuseau
 * représentait historiquement sa valeur. Par défaut, on suppose UTC
 * (convention habituelle des timestamps système d'InternIn).
 *
 * Si l'ancienne base contenait des heures civiles de Douala, lancer avec:
 *   LEGACY_TIMESTAMP_TIME_ZONE=Africa/Douala node script/migrate-timestamps-to-timestamptz.js
 *
 * La migration est transactionnelle et ne touche pas les colonnes DATE.
 */
import "dotenv/config";
import pg from "pg";

const { Client } = pg;
const legacyTimeZone = process.env.LEGACY_TIMESTAMP_TIME_ZONE || "UTC";

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

function quoteIdent(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function quoteLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL est requis.");
  }

  await client.connect();

  try {
    await client.query("BEGIN");

    const { rows } = await client.query(`
      SELECT table_schema, table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND data_type = 'timestamp without time zone'
      ORDER BY table_schema, table_name, ordinal_position
    `);

    for (const row of rows) {
      const table = `${quoteIdent(row.table_schema)}.${quoteIdent(row.table_name)}`;
      const column = quoteIdent(row.column_name);

      await client.query(`
        ALTER TABLE ${table}
        ALTER COLUMN ${column}
        TYPE timestamptz
        USING ${column} AT TIME ZONE ${quoteLiteral(legacyTimeZone)}
      `);

      console.log(
        `✓ ${row.table_schema}.${row.table_name}.${row.column_name} → timestamptz (source=${legacyTimeZone})`,
      );
    }

    await client.query("COMMIT");
    console.log(`\nMigration terminée: ${rows.length} colonne(s) convertie(s).`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Migration échouée:", error);
  process.exit(1);
});
