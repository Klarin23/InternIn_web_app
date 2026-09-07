import {
  resolveEntrepriseContext,
  hasEntreprisePermission,
} from "../utils/entrepriseContext.js";

/**
 * Autorisation de niveau route pour l'espace Supervision.
 *
 * La vérification fine (notamment l'affectation du stage au superviseur)
 * reste dans les services pour éviter les IDOR et conserver la défense en
 * profondeur. Ce middleware garantit toutefois qu'une requête n'atteint pas
 * un handler de supervision sans disposer au préalable de l'autorisation
 * centrale `stagiaires.suivre`.
 *
 * Sont autorisés :
 * - le propriétaire de l'entreprise ;
 * - l'administrateur principal ;
 * - tout membre actif disposant de `stagiaires.suivre` (dont le rôle
 *   superviseur par défaut).
 */
export async function requireSupervisionAccess(req, res, next) {
  if (!req.user?.idUtilisateur) {
    return res.status(401).json({ error: "Authentification requise" });
  }

  try {
    const ctx = await resolveEntrepriseContext(req.user.idUtilisateur);

    if (!ctx || !hasEntreprisePermission(ctx, "stagiaires.suivre")) {
      return res.status(403).json({
        error: "Vous n'avez pas la permission de superviser des stagiaires.",
        code: "SUPERVISION_ACCESS_DENIED",
      });
    }

    // Réutilisable par les handlers éventuels, sans remplacer les contrôles
    // métier effectués par les services.
    req.entrepriseContext = ctx;
    next();
  } catch (err) {
    next(err);
  }
}
