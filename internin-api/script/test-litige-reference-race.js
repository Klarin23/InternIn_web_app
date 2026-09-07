/**
 * Test concurrence des références de litiges.
 * Usage: node --env-file=.env.test script/test-litige-reference-race.js
 *
 * Vérifie que N créations simultanées produisent N références distinctes
 * (plus de COUNT(*)+1).
 */
import { db } from "../src/db/index.js";
import { litigesReclamations, stagiaires, stages, utilisateurs } from "../src/db/schema.js";
import { eq, sql } from "drizzle-orm";
import { createLitige } from "../src/modules/litiges/litiges.service.js";

async function pickStagiaireWithStage() {
  const [row] = await db
    .select({
      idUtilisateur: stagiaires.idUtilisateur,
      idStage: stages.idStage,
    })
    .from(stages)
    .innerJoin(stagiaires, eq(stages.idStagiaire, stagiaires.idStagiaire))
    .limit(1);
  return row;
}

async function main() {
  const ctx = await pickStagiaireWithStage();
  if (!ctx) {
    console.log("SKIP — aucun stage/stagiaire en base de test");
    process.exit(0);
  }

  const N = Number(process.env.RACE_N || 10);
  const payload = {
    idStage: ctx.idStage,
    description:
      "Test concurrence référence signalement — texte suffisamment long pour la validation.",
    cibleType: "entreprise",
    categorie: "autre",
  };

  const results = await Promise.allSettled(
    Array.from({ length: N }, () => createLitige(ctx.idUtilisateur, payload)),
  );

  const ok = results.filter((r) => r.status === "fulfilled").map((r) => r.value);
  const fail = results.filter((r) => r.status === "rejected");

  const refs = ok.map((l) => l.reference).filter(Boolean);
  const unique = new Set(refs);

  console.log(`[race x${N}] success=${ok.length} fail=${fail.length}`);
  console.log(`[race x${N}] refs=${refs.length} unique=${unique.size}`);

  if (fail.length) {
    console.log(
      "failures sample:",
      fail.slice(0, 3).map((f) => f.reason?.message || String(f.reason)),
    );
  }

  if (ok.length === 0) {
    console.error("ÉCHEC — aucune création réussie");
    process.exitCode = 1;
  } else if (unique.size !== refs.length) {
    console.error("ÉCHEC — références dupliquées détectées", refs);
    process.exitCode = 1;
  } else {
    console.log("OK — toutes les références sont uniques");
  }

  // Nettoyage des litiges de test (best-effort)
  for (const l of ok) {
    try {
      await db
        .delete(litigesReclamations)
        .where(eq(litigesReclamations.idLitige, l.idLitige));
    } catch {
      /* ignore */
    }
  }

  // Contrainte UNIQUE
  try {
    await db.execute(sql`
      INSERT INTO litiges_reclamations (
        id_utilisateur_plaignant, description, reference, statut
      ) VALUES (
        ${ctx.idUtilisateur},
        'dup test',
        'RPT-TEST-UNIQUE-LOCK',
        'ouvert'
      )
    `);
    await db.execute(sql`
      INSERT INTO litiges_reclamations (
        id_utilisateur_plaignant, description, reference, statut
      ) VALUES (
        ${ctx.idUtilisateur},
        'dup test 2',
        'RPT-TEST-UNIQUE-LOCK',
        'ouvert'
      )
    `);
    console.error("[unique] ÉCHEC — doublon accepté");
    process.exitCode = 1;
  } catch {
    console.log("[unique] OK — contrainte UNIQUE refuse le doublon");
  } finally {
    await db.execute(sql`
      DELETE FROM litiges_reclamations WHERE reference = 'RPT-TEST-UNIQUE-LOCK'
    `);
  }

  process.exit(process.exitCode || 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
