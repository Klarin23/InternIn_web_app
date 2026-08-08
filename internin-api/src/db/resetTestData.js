// Réinitialise tout le cycle de vie du recrutement (candidatures, entretiens,
// offres finales, conventions, stages, évaluations, certificats, litiges)
// SANS toucher aux offres publiées, aux comptes ni aux profils.
// PostgreSQL CASCADE supprime automatiquement toutes les lignes dépendantes
// (ex: supprimer une candidature supprime ses entretiens liés, etc.).

import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "./index.js";
import { stagiaires } from "./schema.js";
import { eq } from "drizzle-orm";

async function resetTestData() {
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
      litiges_reclamations
    RESTART IDENTITY CASCADE;
  `);

  // Remet tous les stagiaires en "disponible" — un stage de test supprimé
  // ne doit pas laisser un profil bloqué en "actif" sans stage réel.
  await db.update(stagiaires).set({ statutStage: "disponible" });

  console.log(
    "✓ Candidatures, entretiens et tout le cycle de recrutement ont été réinitialisés.",
  );
  console.log(
    "✓ Les offres publiées, comptes et profils n'ont pas été touchés.",
  );
  process.exit(0);
}

resetTestData().catch((err) => {
  console.error(err);
  process.exit(1);
});
