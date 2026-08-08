// Middleware de permission pour les routes sensibles du menu Équipe.
//
// Règles :
// - Le compte "entreprise" propriétaire (typeUtilisateur="entreprise") a
//   toujours accès complet — c'est son entreprise.
// - Un membre invité qui est "administrateur_principal" a aussi accès
//   complet, quelle que soit la permission demandée.
// - Tout autre membre actif n'a accès que si la clé de permission demandée
//   fait partie de ses permissions personnalisées (membresEquipe.permissionsPersonnalisees),
//   ou, à défaut, des permissions par défaut de son rôle
//   (PERMISSIONS_PAR_DEFAUT_ROLE dans equipe.constants.js).
// - Un membre non actif (invité pas encore accepté, ou désactivé) est refusé.
//
// Important : ce middleware ne remplace pas requireAuth (il suppose que
// req.user existe déjà) — il se place juste après, sur les routes qui le
// nécessitent.

import { eq, and } from "drizzle-orm";
import { db } from "../../db/index.js";
import { entreprises, membresEquipe } from "../../db/schema.js";
import { PERMISSIONS_PAR_DEFAUT_ROLE } from "./equipe.constants.js";

export function requireEquipePermission(clePermission) {
  return async function (req, res, next) {
    try {
      const idUtilisateur = req.user.idUtilisateur;

      const [entreprise] = await db
        .select()
        .from(entreprises)
        .where(eq(entreprises.idUtilisateur, idUtilisateur));
      if (entreprise) return next(); // propriétaire : accès complet

      const [membre] = await db
        .select()
        .from(membresEquipe)
        .where(
          and(
            eq(membresEquipe.idUtilisateur, idUtilisateur),
            eq(membresEquipe.statutMembre, "actif"),
          ),
        );

      if (!membre) {
        const err = new Error("Accès refusé");
        err.status = 403;
        throw err;
      }

      if (membre.estAdminPrincipal) return next();

      const permissions =
        membre.permissionsPersonnalisees ??
        PERMISSIONS_PAR_DEFAUT_ROLE[membre.roleEquipe] ??
        [];

      if (!permissions.includes(clePermission)) {
        const err = new Error(
          "Vous n'avez pas la permission nécessaire pour effectuer cette action.",
        );
        err.status = 403;
        throw err;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
