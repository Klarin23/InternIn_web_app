import { Router } from "express";
import {
  lister,
  compter,
  marquerLue,
  marquerTouteslues,
  supprimer,
  supprimerToutes,
  listNotificationsAdminHandler,
  getNotificationsAdminStatsHandler,
  getPreferencesEntreprise,
  patchPreferencesEntreprise,
} from "./notifications.controller.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { updateEntrepriseNotifPrefsSchema } from "./notifications.schema.js";

const router = Router();

// Préférences entreprise — déclarées AVANT "/:id" pour éviter les collisions
router.get("/preferences", requireAuth, getPreferencesEntreprise);
router.patch(
  "/preferences",
  requireAuth,
  validate(updateEntrepriseNotifPrefsSchema),
  patchPreferencesEntreprise,
);

router.get("/", requireAuth, lister);
router.get("/non-lues/compte", requireAuth, compter);
router.patch("/:id/lue", requireAuth, marquerLue);
router.patch("/lues-toutes", requireAuth, marquerTouteslues);
// Route "toutes" déclarée AVANT "/:id" pour ne pas être interceptée par elle.
router.delete("/toutes", requireAuth, supprimerToutes);
router.delete("/:id", requireAuth, supprimer);

router.get(
  "/admin/centre",
  requireAuth,
  requireRole("administrateur"),
  listNotificationsAdminHandler,
);
router.get(
  "/admin/stats",
  requireAuth,
  requireRole("administrateur"),
  getNotificationsAdminStatsHandler,
);

export default router;
