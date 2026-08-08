// Protège une route : exige un token JWT valide dans l'en-tête Authorization.
// Usage : router.get("/me", requireAuth, meController)
//
// Revérifie aussi le statut du compte à CHAQUE requête (pas seulement à la
// connexion) : le token reste valide 7 jours, donc sans cette vérification
// un compte suspendu en cours de session garderait un accès complet à la
// plateforme jusqu'à expiration du token.

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
    // payload contient { idUtilisateur, typeUtilisateur }
    payload = verifyToken(token);
  } catch {
    return res.status(401).json({ error: "Session invalide ou expirée" });
  }

  try {
    const [utilisateur] = await db
      .select({ statutCompte: utilisateurs.statutCompte })
      .from(utilisateurs)
      .where(eq(utilisateurs.idUtilisateur, payload.idUtilisateur));

    if (!utilisateur) {
      return res.status(401).json({ error: "Session invalide ou expirée" });
    }

    if (utilisateur.statutCompte === "suspendu") {
      return res.status(403).json({ error: "Ce compte a été suspendu." });
    }

    req.user = payload;
    next();
  } catch (err) {
    next(err);
  }
}
