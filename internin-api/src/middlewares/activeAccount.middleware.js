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
        emailVerifie: utilisateurs.emailVerifie,
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
      // Distingue le cas précis "email non vérifié" du cas générique
      // "onboarding non terminé", pour que le frontend puisse afficher le
      // bon message (cf. règle de sécurité emailVerifie !== true → pas
      // d'activation, appliquée dans les services d'onboarding).
      if (utilisateur.emailVerifie !== true) {
        return res.status(403).json({
          error:
            "Veuillez vérifier votre adresse email avant d'activer votre compte.",
          code: "EMAIL_NON_VERIFIE",
        });
      }

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
