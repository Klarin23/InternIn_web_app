// Protège une route : exige un token JWT valide dans l'en-tête Authorization.
// Usage : router.get("/me", requireAuth, meController)
//
// À CHAQUE requête :
// - signature + expiration JWT
// - existence du compte
// - statutCompte !== suspendu
// - versionJeton JWT === versionJeton BDD  (révocation immédiate)
// - typeUtilisateur JWT === typeUtilisateur BDD  (rôle à jour)

import { eq } from "drizzle-orm";
import { verifyToken } from "../utils/jwt.js";
import { db } from "../db/index.js";
import { utilisateurs } from "../db/schema.js";

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentification requise" });
  }

  const token = header.split(" ")[1];

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return res.status(401).json({ error: "Session invalide ou expirée" });
  }

  if (!payload?.idUtilisateur) {
    return res.status(401).json({ error: "Session invalide ou expirée" });
  }

  try {
    const [utilisateur] = await db
      .select({
        statutCompte: utilisateurs.statutCompte,
        typeUtilisateur: utilisateurs.typeUtilisateur,
        versionJeton: utilisateurs.versionJeton,
      })
      .from(utilisateurs)
      .where(eq(utilisateurs.idUtilisateur, payload.idUtilisateur));

    if (!utilisateur) {
      return res.status(401).json({ error: "Session invalide ou expirée" });
    }

    if (utilisateur.statutCompte === "suspendu") {
      return res.status(403).json({ error: "Ce compte a été suspendu." });
    }

    // Révocation : version de jeton obsolète (changement de rôle / mdp / etc.)
    const versionJwt = payload.versionJeton ?? 0;
    const versionBdd = utilisateur.versionJeton ?? 0;
    if (versionJwt !== versionBdd) {
      return res.status(401).json({
        error: "Session invalide ou expirée",
        code: "TOKEN_REVOKED",
      });
    }

    // Rôle BDD = source de vérité (JWT ne doit pas conserver d'anciens privilèges)
    if (
      payload.typeUtilisateur &&
      payload.typeUtilisateur !== utilisateur.typeUtilisateur
    ) {
      return res.status(401).json({
        error: "Session invalide ou expirée",
        code: "TOKEN_ROLE_STALE",
      });
    }

    // Enrichir req.user avec les valeurs BDD à jour
    req.user = {
      idUtilisateur: payload.idUtilisateur,
      typeUtilisateur: utilisateur.typeUtilisateur,
      versionJeton: versionBdd,
    };
    next();
  } catch (err) {
    next(err);
  }
}

/** Attache req.user si un JWT valide est présent, sinon continue sans erreur. */
export async function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next();
  }
  const token = header.split(" ")[1];
  try {
    const payload = verifyToken(token);
    if (!payload?.idUtilisateur) return next();

    const [utilisateur] = await db
      .select({
        statutCompte: utilisateurs.statutCompte,
        typeUtilisateur: utilisateurs.typeUtilisateur,
        versionJeton: utilisateurs.versionJeton,
      })
      .from(utilisateurs)
      .where(eq(utilisateurs.idUtilisateur, payload.idUtilisateur));

    if (
      utilisateur &&
      utilisateur.statutCompte !== "suspendu" &&
      (payload.versionJeton ?? 0) === (utilisateur.versionJeton ?? 0) &&
      (!payload.typeUtilisateur ||
        payload.typeUtilisateur === utilisateur.typeUtilisateur)
    ) {
      req.user = {
        idUtilisateur: payload.idUtilisateur,
        typeUtilisateur: utilisateur.typeUtilisateur,
        versionJeton: utilisateur.versionJeton ?? 0,
      };
    }
  } catch {
    /* token invalide → anonyme */
  }
  next();
}
