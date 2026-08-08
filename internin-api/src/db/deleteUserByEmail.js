// Supprime un utilisateur et toutes ses données dépendantes en cascade,
// même si le schéma n'a pas de ON DELETE CASCADE.
// Usage :
//   node src/db/deleteUserByEmail.js email@exemple.com          -> aperçu (dry-run)
//   node src/db/deleteUserByEmail.js email@exemple.com --confirm -> suppression réelle

import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function getForeignKeyGraph() {
  const { rows } = await pool.query(`
    SELECT
      conrelid::regclass::text AS table_name,
      a.attname AS column_name,
      confrelid::regclass::text AS ref_table,
      af.attname AS ref_column
    FROM pg_constraint c
    JOIN unnest(c.conkey) WITH ORDINALITY AS ak(attnum, ord) ON true
    JOIN unnest(c.confkey) WITH ORDINALITY AS afk(attnum, ord) ON afk.ord = ak.ord
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ak.attnum
    JOIN pg_attribute af ON af.attrelid = c.confrelid AND af.attnum = afk.attnum
    WHERE c.contype = 'f';
  `);
  return rows;
}

async function getPrimaryKeyColumn(table) {
  const { rows } = await pool.query(
    `
    SELECT a.attname AS column_name
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE i.indrelid = $1::regclass AND i.indisprimary;
  `,
    [table],
  );
  return rows[0]?.column_name;
}

async function main() {
  const email = process.argv[2];
  const confirm = process.argv.includes("--confirm");

  if (!email) {
    console.error(
      "Usage: node src/db/deleteUserByEmail.js <email> [--confirm]",
    );
    process.exit(1);
  }

  const { rows: userRows } = await pool.query(
    `SELECT id_utilisateur, email, type_utilisateur FROM utilisateurs WHERE email = $1`,
    [email],
  );

  if (userRows.length === 0) {
    console.log(`Aucun utilisateur trouvé avec l'email "${email}".`);
    await pool.end();
    return;
  }

  const rootUser = userRows[0];
  console.log(
    `Utilisateur trouvé : ${rootUser.id_utilisateur} (${rootUser.type_utilisateur})`,
  );

  const fkEdges = await getForeignKeyGraph();

  // BFS : on part de utilisateurs.id_utilisateur = rootUser.id_utilisateur
  // et on remonte tout ce qui dépend de chaque ligne trouvée.
  const pkCache = new Map();
  async function pkOf(table) {
    if (!pkCache.has(table))
      pkCache.set(table, await getPrimaryKeyColumn(table));
    return pkCache.get(table);
  }

  // depthMap : clé "table:pkValue" -> profondeur max à laquelle on l'a trouvée
  const depthMap = new Map();
  let frontier = [
    {
      table: "utilisateurs",
      column: "id_utilisateur",
      value: rootUser.id_utilisateur,
    },
  ];
  let depth = 0;
  depthMap.set(`utilisateurs:${rootUser.id_utilisateur}`, 0);

  while (frontier.length > 0) {
    depth++;
    const nextFrontier = [];

    for (const node of frontier) {
      // Toutes les tables qui référencent node.table.column
      const children = fkEdges.filter(
        (e) => e.ref_table === node.table && e.ref_column === node.column,
      );

      for (const child of children) {
        const pk = await pkOf(child.table_name);
        if (!pk) continue;

        const { rows } = await pool.query(
          `SELECT ${pk} AS pk FROM ${child.table_name} WHERE ${child.column_name} = $1`,
          [node.value],
        );

        for (const row of rows) {
          const key = `${child.table_name}:${row.pk}`;
          const existingDepth = depthMap.get(key) ?? -1;
          if (depth > existingDepth) depthMap.set(key, depth);
          // On continue le BFS même si déjà vu, au cas où profondeur plus grande
          nextFrontier.push({
            table: child.table_name,
            column: pk,
            value: row.pk,
          });
        }
      }
    }

    frontier = nextFrontier;
    if (depth > 15) break; // garde-fou anti boucle infinie
  }

  // Regrouper par table, profondeur max, pour suppression du plus profond au moins profond
  const byDepthDesc = [...depthMap.entries()].sort((a, b) => b[1] - a[1]);

  const grouped = new Map(); // table -> Set(pkValues)
  for (const [key] of byDepthDesc) {
    const [table, pkValue] = key.split(":");
    if (!grouped.has(table)) grouped.set(table, new Set());
    grouped.get(table).add(pkValue);
  }

  console.log("\n=== Aperçu de la suppression ===");
  for (const [table, values] of grouped) {
    console.log(`${table} : ${values.size} ligne(s)`);
  }

  if (!confirm) {
    console.log(
      "\nMode aperçu uniquement. Relance avec --confirm pour supprimer réellement.",
    );
    await pool.end();
    return;
  }

  // Suppression réelle : du plus profond au moins profond, table par table
  const orderedTables = [
    ...new Set(byDepthDesc.map(([key]) => key.split(":")[0])),
  ];

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const table of orderedTables) {
      const pk = await pkOf(table);
      const values = [...grouped.get(table)];
      await client.query(`DELETE FROM ${table} WHERE ${pk} = ANY($1)`, [
        values,
      ]);
      console.log(`Supprimé : ${table} (${values.length})`);
    }
    await client.query(`DELETE FROM utilisateurs WHERE id_utilisateur = $1`, [
      rootUser.id_utilisateur,
    ]);
    console.log("Supprimé : utilisateurs (1)");
    await client.query("COMMIT");
    console.log(
      "\n✓ Utilisateur et toutes ses données dépendantes ont été supprimés.",
    );
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Erreur, rollback effectué :", err);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
