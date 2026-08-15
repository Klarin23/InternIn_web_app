// Crée (ou met à jour) le compte administrateur super_admin.
// Il n'existe aucune inscription publique pour ce rôle : les admins
// sont une équipe interne. statutCompte = "actif" dès la création
// (pas d'onboarding).
//
// Variables d'environnement OBLIGATOIRES :
//   ADMIN_EMAIL
//   ADMIN_PASSWORD
// Optionnel :
//   ADMIN_FORCE_PASSWORD_RESET  ("true" pour forcer un nouveau MDP
//                                si le compte existe déjà)
//
// Usage :
//   npm run db:seed-admin

import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "./index.js";
import { utilisateurs, administrateurs } from "./schema.js";
import { hashPassword } from "../utils/password.js";

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

const rawEmail = process.env.ADMIN_EMAIL;
const rawPassword = process.env.ADMIN_PASSWORD;

if (!rawEmail || !String(rawEmail).trim()) {
  fail(
    "ADMIN_EMAIL est obligatoire. Définissez-le dans l'environnement avant de lancer le seed admin.",
  );
}

if (!rawPassword) {
  fail(
    "ADMIN_PASSWORD est obligatoire. Aucun mot de passe par défaut n'est autorisé.",
  );
}

const ADMIN_EMAIL = String(rawEmail).trim().toLowerCase();
const ADMIN_PASSWORD = rawPassword;

const FORCE_RESET =
  process.env.ADMIN_FORCE_PASSWORD_RESET === "true" ||
  process.env.ADMIN_FORCE_PASSWORD_RESET === "1";

async function seedAdmin() {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ADMIN_EMAIL)) {
    fail(`ADMIN_EMAIL invalide.`);
  }

  if (ADMIN_PASSWORD.length < 12) {
    fail("ADMIN_PASSWORD trop court (minimum 12 caractères).");
  }

  const existing = await db
    .select()
    .from(utilisateurs)
    .where(eq(utilisateurs.email, ADMIN_EMAIL));

  if (existing.length > 0) {
    const user = existing[0];

    if (user.typeUtilisateur !== "administrateur") {
      fail(
        `L'e-mail fourni existe déjà mais n'est pas un compte administrateur (type: ${user.typeUtilisateur}).`,
      );
    }

    if (FORCE_RESET) {
      const motDePasseHash = await hashPassword(ADMIN_PASSWORD);
      await db
        .update(utilisateurs)
        .set({
          motDePasseHash,
          emailVerifie: true,
          statutCompte: "actif",
          dateMaj: new Date(),
        })
        .where(eq(utilisateurs.idUtilisateur, user.idUtilisateur));

      console.log(`✓ Mot de passe administrateur mis à jour pour ${ADMIN_EMAIL}`);
      process.exit(0);
    }

    console.log(
      `• Un compte administrateur existe déjà avec cet e-mail (${ADMIN_EMAIL}).`,
    );
    console.log(
      "  Pour forcer un nouveau mot de passe : ADMIN_FORCE_PASSWORD_RESET=true npm run db:seed-admin",
    );
    process.exit(0);
  }

  const motDePasseHash = await hashPassword(ADMIN_PASSWORD);

  const [utilisateur] = await db
    .insert(utilisateurs)
    .values({
      email: ADMIN_EMAIL,
      motDePasseHash,
      typeUtilisateur: "administrateur",
      methodeConnexion: "email",
      emailVerifie: true,
      statutCompte: "actif",
    })
    .returning();

  await db.insert(administrateurs).values({
    idUtilisateur: utilisateur.idUtilisateur,
    nom: "Administrateur InternIn",
    roleAdmin: "super_admin",
  });

  // Ne jamais logger le mot de passe
  console.log(`✓ Compte administrateur créé`);
  console.log(`  Email    : ${ADMIN_EMAIL}`);
  console.log(`  Rôle     : super_admin`);
  console.log(`  Statut   : actif (email vérifié)`);
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
