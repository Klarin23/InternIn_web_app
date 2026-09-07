/**
 * Après requireAuth + requireRole("administrateur") :
 * charge roleAdmin depuis la BDD et vérifie une scope métier.
 */
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { administrateurs } from "../db/schema.js";
import { adminHasScope } from "../modules/administrateurs/adminRbac.js";

/**
 * Attache req.admin = { idAdmin, roleAdmin, nom } (lecture BDD).
 */
export async function loadAdminProfile(req, res, next) {
  try {
    if (!req.user?.idUtilisateur) {
      return res.status(401).json({ error: "Non authentifié" });
    }
    if (req.admin?.roleAdmin) return next();

    const [admin] = await db
      .select({
        idAdmin: administrateurs.idAdmin,
        roleAdmin: administrateurs.roleAdmin,
        nom: administrateurs.nom,
      })
      .from(administrateurs)
      .where(eq(administrateurs.idUtilisateur, req.user.idUtilisateur))
      .limit(1);

    if (!admin) {
      return res.status(403).json({ error: "Profil administrateur introuvable" });
    }

    req.admin = admin;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * @param {...string} scopes - au moins une scope requise (OR)
 */
export function requireAdminScope(...scopes) {
  return (req, res, next) => {
    const role = req.admin?.roleAdmin;
    if (!role) {
      return res.status(403).json({ error: "Profil administrateur requis" });
    }
    const ok = scopes.some((s) => adminHasScope(role, s));
    if (!ok) {
      return res.status(403).json({
        error: "Permission insuffisante pour cette action",
        code: "ADMIN_SCOPE_DENIED",
      });
    }
    next();
  };
}
