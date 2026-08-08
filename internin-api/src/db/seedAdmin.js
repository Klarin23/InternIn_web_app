// Crée un compte administrateur directement en base — il n'existe aucune
// inscription publique pour ce rôle (cohérent avec le PRD : les admins
// sont une équipe interne, pas des utilisateurs auto-inscrits).
// Contrairement aux autres rôles, statutCompte passe directement à "actif"
// (pas d'onboarding pour un administrateur).

import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "./index.js";
import { utilisateurs, administrateurs } from "./schema.js";
import { hashPassword } from "../utils/password.js";

const ADMIN_EMAIL = "admin@internin.com";
const ADMIN_PASSWORD = "admin123456"; // À changer immédiatement après premier test

async function seedAdmin() {
  const existing = await db
    .select()
    .from(utilisateurs)
    .where(eq(utilisateurs.email, ADMIN_EMAIL));
  if (existing.length > 0) {
    console.log("• Un compte administrateur existe déjà avec cet e-mail.");
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
      statutCompte: "actif", // pas d'onboarding pour un admin
    })
    .returning();

  await db.insert(administrateurs).values({
    idUtilisateur: utilisateur.idUtilisateur,
    nom: "Administrateur InternIn",
    roleAdmin: "super_admin",
  });

  console.log(
    `✓ Compte administrateur créé : ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`,
  );
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
