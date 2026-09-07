// Réinitialise uniquement les données de test.
// SÉCURITÉ : ce script refuse toute base qui n'est pas internin_test.

import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "./index.js";
import { stagiaires } from "./schema.js";

const databaseUrl = process.env.DATABASE_URL ?? "";
const nodeEnv = process.env.NODE_ENV ?? "";

function assertTestDatabase() {
  if (nodeEnv !== "test") {
    throw new Error(
      ` SÉCURITÉ : resetTestData.js exige NODE_ENV=test. ` +
        `Valeur actuelle : ${nodeEnv || "(non définie)"}`,
    );
  }

  let databaseName;

  try {
    databaseName = new URL(databaseUrl).pathname.replace(/^\/+/, "");
  } catch {
    throw new Error(" SÉCURITÉ : DATABASE_URL est invalide ou absente.");
  }

  if (databaseName !== "internin_test") {
    throw new Error(
      ` SÉCURITÉ : resetTestData.js refuse la base "${databaseName}". ` +
        `Seule la base "internin_test" est autorisée.`,
    );
  }
}

async function resetTestData() {
  // IMPORTANT : cette vérification intervient AVANT le TRUNCATE.
  assertTestDatabase();

  console.log(" Base autorisée : internin_test");
  console.log(" Réinitialisation des données de test...");

  await db.execute(sql`
    TRUNCATE TABLE
      candidatures,
      entretiens,
      offres_finales,
      conventions_stage,
      stages,
      evaluations_hebdomadaires,
      coaching_ia_sessions,
      certificats,
      badges,
      recommandations,
      litiges_reclamations,
      propositions_stage,
      favoris_offres,
      notifications
    RESTART IDENTITY CASCADE;
  `);

  // Un stage de test supprimé ne doit pas laisser
  // un stagiaire bloqué en "actif".
  await db.update(stagiaires).set({
    statutStage: "disponible",
  });

  console.log(
    "Candidatures, entretiens, propositions de stage, favoris, " +
      "notifications et cycle de recrutement réinitialisés.",
  );

  console.log(" Offres publiées, comptes et profils conservés.");
}

resetTestData()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n Réinitialisation refusée/échouée :");
    console.error(err.message);
    process.exit(1);
  });
