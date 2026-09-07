import "dotenv/config";
import pg from "pg";

const { Client } = pg;

function qi(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL est obligatoire.");
  if (process.env.NODE_ENV !== "production") {
    console.warn("⚠️ NODE_ENV n'est pas production. Vérifie que DATABASE_URL pointe bien vers Neon production.");
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    await client.query("BEGIN");
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtextextended($1, 0))",
      ["internin:delete-admin:v1"],
    );

    const admins = await client.query(`
      SELECT a.id_admin, a.id_utilisateur, u.email
      FROM administrateurs a
      JOIN utilisateurs u ON u.id_utilisateur = a.id_utilisateur
      ORDER BY u.email
      FOR UPDATE OF a, u
    `);

    if (admins.rowCount === 0) {
      throw new Error("Aucun compte administrateur trouvé. Rien à supprimer.");
    }

    console.log(`ℹ️ ${admins.rowCount} compte(s) administrateur trouvé(s) :`);
    for (const admin of admins.rows) console.log(`   - ${admin.email}`);

    // Cette opération est volontairement DELETE-ONLY : aucun compte n'est créé.
    for (const admin of admins.rows) {
      const { id_admin: adminId, id_utilisateur: userId, email } = admin;
      console.log(`\n🗑️ Suppression de ${email}...`);

      // Références métier qui doivent survivre à la suppression de l'admin.
      await client.query(
        `UPDATE entreprises SET admin_verificateur_id = NULL WHERE admin_verificateur_id = $1`,
        [adminId],
      );
      await client.query(
        `UPDATE litiges_reclamations SET id_admin_assigne = NULL WHERE id_admin_assigne = $1`,
        [adminId],
      );

      // Données privées strictement rattachées à l'admin supprimé.
      // Elles ne peuvent pas rester orphelines car leurs FK sont obligatoires.
      await client.query(`DELETE FROM litiges_notes_internes WHERE id_admin = $1`, [adminId]);

      // Journal/audit : si la FK est nullable, on conserve l'événement mais
      // retire l'identité du compte supprimé.
      await client.query(`
        UPDATE journal_actions_admin
        SET id_administrateur = NULL
        WHERE id_administrateur = $1
      `, [userId]);

      // Alertes : conserver l'alerte, mais retirer l'identité de l'admin.
      await client.query(`
        UPDATE alertes_securite
        SET id_admin_resolution = NULL
        WHERE id_admin_resolution = $1
      `, [userId]);

      // Données techniques de session/authentification.
      await client.query(`DELETE FROM sse_tickets WHERE id_utilisateur = $1`, [userId]);
      await client.query(`DELETE FROM sessions_utilisateur WHERE id_utilisateur = $1`, [userId]);
      await client.query(`DELETE FROM verifications_email WHERE id_utilisateur = $1`, [userId]);
      await client.query(`DELETE FROM tentatives_connexion WHERE id_utilisateur = $1`, [userId]);

      await client.query(`DELETE FROM administrateurs WHERE id_admin = $1`, [adminId]);

      // Vérifie dynamiquement les FK restantes vers utilisateurs avant le DELETE.
      const refs = await client.query(`
        SELECT
          n.nspname AS schema_name,
          c.relname AS table_name,
          a.attname AS column_name,
          con.confdeltype
        FROM pg_constraint con
        JOIN pg_class c ON c.oid = con.conrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = ANY(con.conkey)
        JOIN pg_class p ON p.oid = con.confrelid
        JOIN pg_namespace pn ON pn.oid = p.oid::regnamespace
        WHERE con.contype = 'f'
          AND pn.nspname = 'public'
          AND p.relname = 'utilisateurs'
        ORDER BY n.nspname, c.relname, a.attname
      `);

      const blocking = [];
      for (const ref of refs.rows) {
        const result = await client.query(
          `SELECT 1 FROM ${qi(ref.schema_name)}.${qi(ref.table_name)} WHERE ${qi(ref.column_name)} = $1 LIMIT 1`,
          [userId],
        );
        if (result.rowCount) blocking.push(`${ref.table_name}.${ref.column_name}`);
      }

      if (blocking.length) {
        throw new Error(
          `Suppression interrompue pour ${email} : références métier restantes vers utilisateurs : ${blocking.join(", ")}. ` +
          `Aucun changement ne sera conservé (ROLLBACK).`,
        );
      }

      await client.query(`DELETE FROM utilisateurs WHERE id_utilisateur = $1`, [userId]);
      console.log(`   ✓ ${email} supprimé définitivement.`);
    }

    await client.query("COMMIT");
    console.log("\n✅ Tous les comptes administrateur existants ont été supprimés définitivement.");
    console.log("ℹ️ Aucun nouvel administrateur n'a été créé.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(`\n❌ ${error?.message || error}`);
  process.exitCode = 1;
});
