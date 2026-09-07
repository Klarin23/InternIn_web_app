// Middleware central de permission pour l'espace Entreprise.
//
// Flux :
//   Authentification (requireAuth)
//   → entreprise résolue (propriétaire OU membre actif)
//   → membre actif (si membre)
//   → permission requise
//   → controller (qui doit encore vérifier la propriété de la ressource)
//
// Règles :
// - Le compte propriétaire (typeUtilisateur="entreprise") a toujours accès.
// - Un membre "administrateur_principal" (estAdminPrincipal) a toujours accès.
// - Tout autre membre actif n'a accès que si la clé de permission demandée
//   figure dans ses permissions effectives (personnalisées ou défaut du rôle).
// - Un membre non actif (invité / désactivé) est refusé → 403.
// - Les permissions ne sont JAMAIS lues depuis un JWT ancien : on interroge
//   la base à chaque requête.
//
// Usage :
//   router.post("/", requireAuth, requireEquipePermission("offres.gerer"), handler)

import {
  resolveEntrepriseContext,
  resolveEntrepriseContextOrThrow,
} from "../../utils/entrepriseContext.js";

/**
 * Middleware factory : exige la permission `clePermission`.
 * Attache aussi req.entrepriseContext pour les handlers suivants.
 */
export function requireEquipePermission(clePermission) {
  return async function (req, res, next) {
    try {
      const idUtilisateur = req.user?.idUtilisateur;
      if (!idUtilisateur) {
        const err = new Error("Authentification requise");
        err.status = 401;
        throw err;
      }

      const ctx = await resolveEntrepriseContext(idUtilisateur);

      if (!ctx) {
        const err = new Error("Accès refusé");
        err.status = 403;
        throw err;
      }

      // Propriétaire ou admin principal → accès complet
      if (ctx.isProprietaire || ctx.isAdminPrincipal) {
        req.entrepriseContext = ctx;
        req.entreprise = ctx.entreprise;
        return next();
      }

      // Membre actif avec la permission
      if (!ctx.permissionsEffectives.includes(clePermission)) {
        const err = new Error(
          "Vous n'avez pas la permission nécessaire pour effectuer cette action.",
        );
        err.status = 403;
        throw err;
      }

      req.entrepriseContext = ctx;
      req.entreprise = ctx.entreprise;
      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Variante : exige au moins une des permissions listées.
 */
export function requireAnyEquipePermission(...cles) {
  return async function (req, res, next) {
    try {
      const idUtilisateur = req.user?.idUtilisateur;
      if (!idUtilisateur) {
        const err = new Error("Authentification requise");
        err.status = 401;
        throw err;
      }

      const ctx = await resolveEntrepriseContext(idUtilisateur);
      if (!ctx) {
        const err = new Error("Accès refusé");
        err.status = 403;
        throw err;
      }

      if (ctx.isProprietaire || ctx.isAdminPrincipal) {
        req.entrepriseContext = ctx;
        req.entreprise = ctx.entreprise;
        return next();
      }

      const hasOne = cles.some((c) => ctx.permissionsEffectives.includes(c));
      if (!hasOne) {
        const err = new Error(
          "Vous n'avez pas la permission nécessaire pour effectuer cette action.",
        );
        err.status = 403;
        throw err;
      }

      req.entrepriseContext = ctx;
      req.entreprise = ctx.entreprise;
      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Middleware léger : résout le contexte entreprise sans exiger de permission
 * particulière (pour les routes de lecture ouvertes à tout membre actif).
 */
export async function attachEntrepriseContext(req, res, next) {
  try {
    if (!req.user?.idUtilisateur) return next();
    const ctx = await resolveEntrepriseContext(req.user.idUtilisateur);
    if (ctx) {
      req.entrepriseContext = ctx;
      req.entreprise = ctx.entreprise;
    }
    next();
  } catch (err) {
    next(err);
  }
}

export { resolveEntrepriseContext, resolveEntrepriseContextOrThrow };
