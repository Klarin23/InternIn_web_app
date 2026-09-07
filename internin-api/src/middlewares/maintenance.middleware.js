/**
 * Mode maintenance plateforme.
 * - Lit parametres_plateforme.mode_maintenance (cache ~15s)
 * - Autorise toujours : /health, /auth/*, GET public status
 * - Autorise les administrateurs si admins_peuvent_acceder
 * - Sinon répond 503 { code: "MAINTENANCE", message }
 */
import { verifyToken } from "../utils/jwt.js";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { parametresPlateforme, utilisateurs } from "../db/schema.js";

let cache = { at: 0, data: null };
const TTL_MS = 15_000;

async function loadMaintenanceParams() {
  const now = Date.now();
  if (cache.data && now - cache.at < TTL_MS) return cache.data;

  try {
    const [row] = await db.select().from(parametresPlateforme).limit(1);
    cache = {
      at: now,
      data: row || {
        modeMaintenance: false,
        messageMaintenance: null,
        adminsPeuventAcceder: true,
        maintenanceDebut: null,
        maintenanceFin: null,
      },
    };
  } catch {
    cache = {
      at: now,
      data: { modeMaintenance: false, adminsPeuventAcceder: true },
    };
  }
  return cache.data;
}

/** Invalide le cache après un PATCH paramètres (appelé depuis le service). */
export function invalidateMaintenanceCache() {
  cache = { at: 0, data: null };
}

function isExemptPath(path) {
  if (!path) return false;
  if (path === "/health" || path.startsWith("/health?")) return true;
  if (path.startsWith("/auth")) return true;
  // Status public pour le front
  if (path.startsWith("/public/maintenance")) return true;
  return false;
}

async function resolveIsAdmin(req) {
  // Déjà enrichi par requireAuth
  if (req.user?.typeUtilisateur === "administrateur") return true;

  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return false;

  try {
    const payload = verifyToken(header.slice(7));
    if (!payload?.idUtilisateur) return false;

    if (payload.typeUtilisateur === "administrateur") {
      // Vérifier en BDD (rôle à jour)
      const [u] = await db
        .select({ typeUtilisateur: utilisateurs.typeUtilisateur })
        .from(utilisateurs)
        .where(eq(utilisateurs.idUtilisateur, payload.idUtilisateur));
      return u?.typeUtilisateur === "administrateur";
    }
  } catch {
    return false;
  }
  return false;
}

export async function checkMaintenance(req, res, next) {
  try {
    if (isExemptPath(req.path)) return next();

    const params = await loadMaintenanceParams();
    if (!params.modeMaintenance) return next();

    // Fenêtre optionnelle début/fin
    const now = new Date();
    if (params.maintenanceDebut && now < new Date(params.maintenanceDebut)) {
      return next();
    }
    if (params.maintenanceFin && now > new Date(params.maintenanceFin)) {
      return next();
    }

    const isAdmin = await resolveIsAdmin(req);
    if (isAdmin && params.adminsPeuventAcceder !== false) {
      return next();
    }

    return res.status(503).json({
      error:
        params.messageMaintenance ||
        "InternIn est actuellement en maintenance. Nous serons de retour très bientôt.",
      code: "MAINTENANCE",
      maintenance: {
        active: true,
        debut: params.maintenanceDebut,
        fin: params.maintenanceFin,
      },
    });
  } catch (err) {
    // En cas d'erreur DB, ne pas bloquer toute la plateforme
    next();
  }
}
