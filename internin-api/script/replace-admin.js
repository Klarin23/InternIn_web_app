// Remplace tous les comptes administrateurs existants par un nouvel admin.
// Le mot de passe est demandé interactivement et n'est jamais affiché ni loggé.
//
// Variables obligatoires :
//   DATABASE_URL
//   NEW_ADMIN_EMAIL (ex: admin@internin.co)
//
// Usage :
//   NEW_ADMIN_EMAIL=admin@internin.co npm run db:replace-admin
//
// Le script est transactionnel : si une dépendance inattendue empêche la
// suppression, aucune modification n'est conservée.

import "dotenv/config";
import pg from "pg";
import readline from "readline";
import { hashPassword } from "../src/utils/password.js";

const { Client } = pg;

function fail(message) {
  console.error(`❌ ${message}`);
  process.exitCode = 1;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function askHidden(question) {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    const stdout = process.stdout;
    const rl = readline.createInterface({ input: stdin, output: stdout });

    stdout.write(question);

    let value = "";
    const wasRaw = stdin.isRaw;
    if (stdin.isTTY) stdin.setRawMode(true);
    stdin.resume();

    const cleanup = () => {
      if (stdin.isTTY) stdin.setRawMode(Boolean(wasRaw));
      rl.close();
      stdin.removeListener("data", onData);
    };

    const onData = (chunk) => {
      const data = chunk.toString("utf8");

      if (data === "\u0003") {
        cleanup();
        stdout.write("\n");
        reject(new Error("Saisie interrompue."));
        return;
      }

      if (data === "\r" || data === "\n") {
        cleanup();
        stdout.write("\n");
        resolve(value);
        return;
      }

      if (data === "\u007f" || data === "\b") {
        value = value.slice(0, -1);
        return;
      }

      if (!data.includes("\u001b")) value += data;
    };

    stdin.on("data", onData);
  });
}

async function getPasswordPair() {
  const password = await askHidden("Nouveau mot de passe admin (min. 12 caractères) : ");
  const confirmation = await askHidden("Confirmer le mot de passe : ");

  if (password.length < 12) {
    throw new Error("Le mot de passe doit contenir au moins 12 caractères.");
  }
  if (password !== confirmation) {
    throw new Error("Les deux mots de passe ne correspondent pas.");
  }
  return password;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const email = normalizeEmail(process.env.NEW_ADMIN_EMAIL || "admin@internin.co");

  if (!databaseUrl) throw new Error("DATABASE_URL est obligatoire.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error(`Adresse e-mail invalide : ${email}`);
  }

  if (process.env.NODE_ENV !== "production") {
    console.warn("⚠️  NODE_ENV n'est pas 'production'. Vérifie que DATABASE_URL pointe bien vers la bonne base.");
  }

  const password = await getPasswordPair();
  const client = new Client({ connectionString: databaseUrl });

  await client.connect();

  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [
      "internin:replace-admin:v1",
    ]);

    // Le nouvel e-mail ne doit pas déjà appartenir à un autre type de compte.
    const existingNew = await client.query(
      `SELECT id_utilisateur, type_utilisateur, statut_compte
       FROM utilisateurs
       WHERE lower(email) = $1
       FOR UPDATE`,
      [email],
    );

    if (existingNew.rows.length) {
      throw new Error(
        `L'adresse ${email} existe déjà (type=${existingNew.rows[0].type_utilisateur}). ` +
        "Le script ne réutilise pas un compte existant pour éviter une suppression accidentelle.",
      );
    }

    const admins = await client.query(
      `SELECT a.id_admin, a.id_utilisateur, u.email
       FROM administrateurs a
       JOIN utilisateurs u ON u.id_utilisateur = a.id_utilisateur
       FOR UPDATE OF a, u`,
    );

    console.log(`ℹ️  ${admins.rows.length} compte(s) administrateur trouvé(s).`);

    for (const admin of admins.rows) {
      const userId = admin.id_utilisateur;
      const adminId = admin.id_admin;

      // Références métier facultatives vers l'ancien admin : on les conserve
      // mais on retire l'identité de l'ancien compte.
      await client.query(
        `UPDATE litiges_reclamations
         SET id_admin_assigne = NULL
         WHERE id_admin_assigne = $1`,
        [adminId],
      );
      await client.query(
        `UPDATE journal_actions_admin
         SET id_administrateur = NULL
         WHERE id_administrateur = $1`,
        [userId],
      );
      await client.query(
        `UPDATE alertes_securite
         SET id_admin_resolution = NULL
         WHERE id_admin_resolution = $1`,
        [userId],
      );
      await client.query(
        `UPDATE alertes_securite
         SET id_utilisateur_cible = NULL
         WHERE id_utilisateur_cible = $1`,
        [userId],
      );

      // L'admin peut être le vérificateur d'une entreprise. Cette référence
      // est facultative : on la neutralise avant de supprimer la ligne admin.
      await client.query(
        `UPDATE entreprises
         SET admin_verificateur_id = NULL
         WHERE admin_verificateur_id = $1`,
        [adminId],
      );

      // Données strictement rattachées au compte d'authentification.
      await client.query(`DELETE FROM sse_tickets WHERE id_utilisateur = $1`, [userId]);
      await client.query(`DELETE FROM sessions_utilisateur WHERE id_utilisateur = $1`, [userId]);
      await client.query(`DELETE FROM verifications_email WHERE id_utilisateur = $1`, [userId]);
      await client.query(`DELETE FROM tentatives_connexion WHERE id_utilisateur = $1`, [userId]);

      await client.query(`DELETE FROM administrateurs WHERE id_admin = $1`, [adminId]);

      // Vérification générique : aucune FK restante ne doit bloquer la
      // suppression du compte utilisateur. On ne supprime jamais aveuglément
      // une donnée métier inconnue.
      const refs = await client.query(
        `SELECT
           n.nspname AS schema_name,
           c.relname AS table_name,
           a.attname AS column_name
         FROM pg_constraint con
         JOIN pg_class c ON c.oid = con.conrelid
         JOIN pg_namespace n ON n.oid = c.relnamespace
         JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = ANY(con.conkey)
         JOIN pg_class p ON p.oid = con.confrelid
         JOIN pg_namespace pn ON pn.oid = p.relnamespace
         WHERE con.contype = 'f'
           AND pn.nspname = 'public'
           AND p.relname = 'utilisateurs'
           AND con.confdeltype NOT IN ('c', 'n')
           AND NOT (n.nspname = 'public' AND c.relname IN ('administrateurs', 'sessions_utilisateur', 'sse_tickets', 'verifications_email', 'tentatives_connexion'))
         ORDER BY n.nspname, c.relname, a.attname`,
      );

      // Les FK nullable ont été neutralisées ci-dessus pour les références
      // d'administration connues. Toute autre référence est une dépendance
      // métier que le script refuse de supprimer automatiquement.
      const blocking = [];
      for (const ref of refs.rows) {
        const check = await client.query(
          `SELECT 1 FROM ${quoteIdent(ref.schema_name)}.${quoteIdent(ref.table_name)} WHERE ${quoteIdent(ref.column_name)} = $1 LIMIT 1`,
          [userId],
        );
        if (check.rowCount) blocking.push(`${ref.table_name}.${ref.column_name}`);
      }

      if (blocking.length) {
        throw new Error(
          `Impossible de supprimer ${admin.email} automatiquement : dépendances métier restantes (${blocking.join(", ")}). ` +
          "Aucune modification ne sera commitée.",
        );
      }

      await client.query(`DELETE FROM utilisateurs WHERE id_utilisateur = $1`, [userId]);
      console.log(`✓ Ancien admin supprimé : ${admin.email}`);
    }

    const hash = await hashPassword(password);

    const inserted = await client.query(
      `INSERT INTO utilisateurs
         (email, mot_de_passe_hash, type_utilisateur, methode_connexion,
          email_verifie, statut_compte, version_jeton, date_creation, date_maj)
       VALUES ($1, $2, 'administrateur', 'email', true, 'actif', 0, NOW(), NOW())
       RETURNING id_utilisateur, email, type_utilisateur, statut_compte, email_verifie`,
      [email, hash],
    );

    const user = inserted.rows[0];

    await client.query(
      `INSERT INTO administrateurs (id_utilisateur, nom, role_admin)
       VALUES ($1, $2, 'super_admin')`,
      [user.id_utilisateur, "Administrateur InternIn"],
    );

    await client.query("COMMIT");

    console.log("\n✅ Nouveau compte administrateur créé avec succès.");
    console.log(`   Email : ${user.email}`);
    console.log("   Rôle  : super_admin");
    console.log("   Statut : actif / e-mail vérifié");
    console.log("   Mot de passe : configuré (jamais affiché)\n");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

function quoteIdent(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

main().catch((error) => {
  fail(error?.message || error);
});
