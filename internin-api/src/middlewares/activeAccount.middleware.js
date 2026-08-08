import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { utilisateurs } from "../db/schema.js";

export async function requireActiveAccount(req, res, next) {
  try {
    if (!req.user?.idUtilisateur) {
      return res.status(401).json({
        error: "Authentification requise",
      });
    }

    const [utilisateur] = await db
      .select({
        statutCompte: utilisateurs.statutCompte,
      })
      .from(utilisateurs)
      .where(eq(utilisateurs.idUtilisateur, req.user.idUtilisateur));

    if (!utilisateur) {
      return res.status(401).json({
        error: "Session invalide ou expirée",
      });
    }

    if (utilisateur.statutCompte === "suspendu") {
      return res.status(403).json({
        error: "Ce compte a été suspendu.",
      });
    }

    if (utilisateur.statutCompte !== "actif") {
      return res.status(403).json({
        error:
          "Votre compte doit être actif pour utiliser cette fonctionnalité. Veuillez terminer l'activation de votre compte.",
        code: "ACCOUNT_INACTIVE",
      });
    }

    next();
  } catch (err) {
    next(err);
  }
}
