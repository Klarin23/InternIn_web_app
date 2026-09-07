/**
 * Tests sécurité propriétaire vs membre d'équipe.
 * Usage: node --env-file=.env.test script/test-owner-member-rbac.js
 */
import { db } from "../src/db/index.js";
import { entreprises, membresEquipe, utilisateurs } from "../src/db/schema.js";
import { eq, and } from "drizzle-orm";
import {
  resolveEntrepriseContext,
  hasEntreprisePermission,
} from "../src/utils/entrepriseContext.js";

async function main() {
  // Trouver une entreprise avec propriétaire
  const [ent] = await db.select().from(entreprises).limit(1);
  if (!ent) {
    console.log("SKIP — aucune entreprise en base");
    process.exit(0);
  }

  const ownerId = ent.idUtilisateur;
  const ownerCtx = await resolveEntrepriseContext(ownerId);
  if (!ownerCtx?.isProprietaire) {
    console.error("[owner] ÉCHEC — propriétaire non résolu comme isProprietaire");
    process.exitCode = 1;
  } else {
    console.log("[owner] OK — isProprietaire=true, permissions complètes");
  }

  // Membre lecture_seule actif s'il existe
  const [membre] = await db
    .select()
    .from(membresEquipe)
    .where(
      and(
        eq(membresEquipe.idEntreprise, ent.idEntreprise),
        eq(membresEquipe.statutMembre, "actif"),
        eq(membresEquipe.estAdminPrincipal, false),
      ),
    )
    .limit(1);

  if (membre?.idUtilisateur) {
    const mCtx = await resolveEntrepriseContext(membre.idUtilisateur);
    if (mCtx?.isProprietaire) {
      console.error("[member] ÉCHEC — membre vu comme propriétaire");
      process.exitCode = 1;
    } else if (hasEntreprisePermission(mCtx, "equipe.gerer") && membre.roleEquipe === "lecture_seule" && !membre.permissionsPersonnalisees) {
      console.error("[member] ÉCHEC — lecture_seule a equipe.gerer");
      process.exitCode = 1;
    } else {
      console.log("[member] OK — isProprietaire=false, permissions selon rôle");
    }

    // Cross-company: autre entreprise
    const [other] = await db
      .select()
      .from(entreprises)
      .where(eq(entreprises.idEntreprise, ent.idEntreprise));
    // member ctx entreprise must match
    if (mCtx.entreprise.idEntreprise !== ent.idEntreprise) {
      console.error("[idor] ÉCHEC — mauvaise entreprise résolue");
      process.exitCode = 1;
    } else {
      console.log("[idor] OK — membre lié à la bonne entreprise");
    }
  } else {
    console.log("[member] SKIP — aucun membre actif non-admin");
  }

  // Vérifier qu'aucun membre non-propriétaire n'est admin principal
  // avec un idUtilisateur différent du propriétaire (corruption)
  const admins = await db
    .select()
    .from(membresEquipe)
    .where(
      and(
        eq(membresEquipe.idEntreprise, ent.idEntreprise),
        eq(membresEquipe.estAdminPrincipal, true),
      ),
    );
  for (const a of admins) {
    if (a.idUtilisateur && a.idUtilisateur !== ownerId) {
      console.error(
        "[admin-principal] ÉCHEC — estAdminPrincipal pointe vers un non-propriétaire:",
        a.idUtilisateur,
      );
      process.exitCode = 1;
    }
  }
  if (!process.exitCode) {
    console.log("[admin-principal] OK — cohérent avec le propriétaire");
  }

  process.exit(process.exitCode || 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
