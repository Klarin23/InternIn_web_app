// Bloque l'accès aux fonctionnalités stage tant que l'entreprise
// n'a pas été validée par un administrateur (statutVerification = "verifiee").
// Fonctionne pour le propriétaire ET les membres d'équipe actifs.

import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { entreprises, membresEquipe } from "../db/schema.js";

const ROLES_ENTREPRISE = new Set(["entreprise", "membre_entreprise"]);

export async function requireEntrepriseVerifiee(req, res, next) {
  // Ne s'applique qu'aux comptes entreprise / membres d'équipe
  if (!req.user || !ROLES_ENTREPRISE.has(req.user.typeUtilisateur)) {
    return next();
  }

  try {
    const idUtilisateur = req.user.idUtilisateur;

    // 1) Propriétaire de l'entreprise
    let [entreprise] = await db
      .select({
        idEntreprise: entreprises.idEntreprise,
        statutVerification: entreprises.statutVerification,
      })
      .from(entreprises)
      .where(eq(entreprises.idUtilisateur, idUtilisateur));

    // 2) Sinon membre d'équipe actif
    if (!entreprise) {
      const [membre] = await db
        .select({ idEntreprise: membresEquipe.idEntreprise })
        .from(membresEquipe)
        .where(
          and(
            eq(membresEquipe.idUtilisateur, idUtilisateur),
            eq(membresEquipe.statutMembre, "actif"),
          ),
        );

      if (membre) {
        [entreprise] = await db
          .select({
            idEntreprise: entreprises.idEntreprise,
            statutVerification: entreprises.statutVerification,
          })
          .from(entreprises)
          .where(eq(entreprises.idEntreprise, membre.idEntreprise));
      }
    }

    if (!entreprise) {
      return res.status(404).json({ error: "Profil entreprise introuvable" });
    }

    if (entreprise.statutVerification !== "verifiee") {
      return res.status(403).json({
        error:
          "Votre entreprise doit être vérifiée par l'administration avant d'accéder aux fonctionnalités liées aux stages (offres, candidatures, entretiens, etc.).",
        code: "ENTREPRISE_NON_VERIFIEE",
        statutVerification: entreprise.statutVerification,
      });
    }

    // Utile pour les handlers suivants
    req.entreprise = entreprise;
    next();
  } catch (err) {
    next(err);
  }
}
