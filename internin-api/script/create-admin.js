import "dotenv/config";
import readline from "readline";
import { sql, eq } from "drizzle-orm";
import { db } from "../src/db/index.js";
import { utilisateurs, administrateurs } from "../src/db/schema.js";
import { hashPassword } from "../src/utils/password.js";

const DEFAULT_EMAIL = "admin@internin.co";
const DEFAULT_NAME = "Administrateur InternIn";

function fail(message) {
  console.error(`❌ ${message}`);
  process.exitCode = 1;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function promptHidden(question) {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    const stdout = process.stdout;
    const rl = readline.createInterface({ input: stdin, output: stdout, terminal: true });
    let password = "";
    const wasRaw = stdin.isRaw;

    stdout.write(question);

    const cleanup = () => {
      if (stdin.isTTY) stdin.setRawMode(Boolean(wasRaw));
      stdin.removeListener("data", onData);
      rl.close();
      stdout.write("\n");
    };

    const finish = (value) => {
      cleanup();
      resolve(value);
    };

    const onData = (chunk) => {
      const key = String(chunk);
      if (key === "\u0003") {
        cleanup();
        reject(new Error("Saisie interrompue."));
        return;
      }
      if (key === "\r" || key === "\n") {
        finish(password);
        return;
      }
      if (key === "\u007f" || key === "\b") {
        password = password.slice(0, -1);
        return;
      }
      if (!key.includes("\u001b")) password += key;
    };

    if (stdin.isTTY) stdin.setRawMode(true);
    stdin.resume();
    stdin.on("data", onData);
  });
}

async function main() {
  if (process.env.NODE_ENV !== "production") {
    throw new Error("Ce script est réservé à la production. Définissez NODE_ENV=production.");
  }

  const email = normalizeEmail(process.env.ADMIN_EMAIL || DEFAULT_EMAIL);
  const nom = String(process.env.ADMIN_NAME || DEFAULT_NAME).trim();

  if (!validEmail(email)) throw new Error("ADMIN_EMAIL invalide.");
  if (!nom) throw new Error("ADMIN_NAME ne peut pas être vide.");

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL est obligatoire.");
  }

  const password = await promptHidden(`Mot de passe pour ${email} (minimum 12 caractères) : `);
  if (password.length < 12) throw new Error("Mot de passe trop court (minimum 12 caractères).");
  const confirmation = await promptHidden("Confirmer le mot de passe : ");
  if (password !== confirmation) throw new Error("Les mots de passe ne correspondent pas.");

  const hash = await hashPassword(password);

  await db.transaction(async (tx) => {
    // Empêche deux créations concurrentes du même compte.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended('internin:create-admin:v1', 0))`);

    const [existingUser] = await tx
      .select({
        idUtilisateur: utilisateurs.idUtilisateur,
        typeUtilisateur: utilisateurs.typeUtilisateur,
      })
      .from(utilisateurs)
      .where(eq(utilisateurs.email, email))
      .limit(1);

    if (existingUser) {
      throw new Error(
        `L'adresse ${email} existe déjà (type: ${existingUser.typeUtilisateur}). Aucun compte n'a été modifié.`,
      );
    }

    const [user] = await tx
      .insert(utilisateurs)
      .values({
        email,
        motDePasseHash: hash,
        typeUtilisateur: "administrateur",
        methodeConnexion: "email",
        emailVerifie: true,
        statutCompte: "actif",
        versionJeton: 0,
      })
      .returning({ idUtilisateur: utilisateurs.idUtilisateur });

    await tx.insert(administrateurs).values({
      idUtilisateur: user.idUtilisateur,
      nom,
      roleAdmin: "super_admin",
    });
  });

  console.log("\n✅ Compte administrateur créé avec succès.");
  console.log(`   Email  : ${email}`);
  console.log(`   Nom    : ${nom}`);
  console.log("   Rôle   : super_admin");
  console.log("   Statut : actif / e-mail vérifié");
  console.log("🔐 Le mot de passe n'a pas été affiché ni enregistré.");
}

main().catch((err) => {
  console.error(`❌ ${err.message || err}`);
  process.exitCode = 1;
});
