

import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "./index.js";

const databaseUrl = process.env.DATABASE_URL ?? "";
const nodeEnv = process.env.NODE_ENV ?? "";
const resetConfirmation = process.env.RESET_DEV_DATA ?? "";

function getDatabaseName() {
  try {
    return new URL(databaseUrl).pathname.replace(/^\/+/, "");
  } catch {
    throw new Error("SÉCURITÉ : DATABASE_URL est absente ou invalide.");
  }
}

function assertDevelopmentDatabase() {
  if (nodeEnv !== "development") {
    throw new Error(
      `SÉCURITÉ : ce script exige NODE_ENV=development. ` +
        `Valeur actuelle : ${nodeEnv || "(non définie)"}`,
    );
  }

  const databaseName = getDatabaseName();

  if (databaseName !== "internin_dev") {
    throw new Error(
      `SÉCURITÉ : ce script refuse la base "${databaseName}". ` +
        `Seule la base "internin_dev" est autorisée.`,
    );
  }

  if (resetConfirmation !== "YES") {
    throw new Error(
      "SÉCURITÉ : réinitialisation refusée. " +
        "Définissez RESET_DEV_DATA=YES pour confirmer.",
    );
  }
}

async function resetDevTestData() {
  assertDevelopmentDatabase();

  console.log("");
  console.log("==============================================");
  console.log(" INTERNIN — RESET DES DONNÉES DE DÉVELOPPEMENT");
  console.log("==============================================");
  console.log("");
  console.log("Base autorisée : internin_dev");
  console.log("Environnement : development");
  console.log("");

  await db.transaction(async (tx) => {
    /*
     * IMPORTANT :
     *
     * CASCADE permet à PostgreSQL de supprimer les données
     * dépendantes des tables métier sélectionnées.
     *
     * Les tables utilisateurs / entreprises / stagiaires /
     * référentiels ne sont volontairement PAS présentes ici.
     */

    await tx.execute(sql`
      TRUNCATE TABLE
        candidatures,
        propositions_stage,
        offres_stage,

        entretiens,
        offres_finales,
        conventions_stage,
        stages,

        objectifs_stage,
        taches_stage,
        journal_stage,
        evaluations_hebdomadaires,
        evaluations_candidature,

        coaching_ia_sessions,
        recommandations,

        litiges_reclamations,
        notifications,

        favoris_offres

      RESTART IDENTITY CASCADE;
    `);
  });

  console.log("✓ Candidatures supprimées");
  console.log("✓ Propositions supprimées");
  console.log("✓ Offres supprimées");
  console.log("✓ Entretiens supprimés");
  console.log("✓ Offres finales supprimées");
  console.log("✓ Conventions supprimées");
  console.log("✓ Stages supprimés");
  console.log("✓ Objectifs de stage supprimés");
  console.log("✓ Tâches de stage supprimées");
  console.log("✓ Journaux de stage supprimés");
  console.log("✓ Évaluations supprimées");
  console.log("✓ Signalements supprimés");
  console.log("✓ Notifications supprimées");
  console.log("✓ Favoris supprimés");
  console.log("✓ Données de coaching/recommandations supprimées");
  console.log("");
  console.log("==============================================");
  console.log(" RESET TERMINÉ AVEC SUCCÈS");
  console.log("==============================================");
  console.log("");
  console.log("Les comptes, entreprises, stagiaires, universités,");
  console.log("administrateurs et données de référence ont été conservés.");
  console.log("");
}

resetDevTestData()
  .then(async () => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("");
    console.error("✗ Réinitialisation refusée/échouée :");
    console.error(error.message);
    console.error("");
    process.exit(1);
  });
