import { Router } from "express";
import {
  completeOnboarding,
  getMe,
  updateMe,
  updateMyLogo,
} from "./entreprises.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { requireEquipePermission } from "../equipe/equipe.permissions.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { upload } from "../../utils/upload.js";
import {
  completeOnboardingEntrepriseSchema,
  updateProfileEntrepriseSchema,
} from "./entreprises.schema.js";

const router = Router();

router.post(
  "/onboarding",
  requireAuth,
  // Seuls les comptes de type "entreprise" peuvent finaliser l'onboarding.
  // Empêche un stagiaire (ou autre rôle) d'escalader vers un profil entreprise.
  requireRole("entreprise"),
  validate(completeOnboardingEntrepriseSchema),
  completeOnboarding,
);
router.get("/me", requireAuth, getMe);
router.patch(
  "/me",
  requireAuth,
  requireEquipePermission("parametres.gerer"),
  validate(updateProfileEntrepriseSchema),
  updateMe,
);
router.post(
  "/me/logo",
  requireAuth,
  requireEquipePermission("parametres.gerer"),
  (req, res, next) => {
    req.params.type = "logo";
    next();
  },
  upload.single("file"),
  updateMyLogo,
);

export default router;
