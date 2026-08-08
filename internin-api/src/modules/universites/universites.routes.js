import { Router } from "express";
import {
  completeOnboarding,
  getProfile,
  updateProfile,
  getStats,
  listEtudiantsHandler,
  listEntreprisesHandler,
  listConventionsHandler,
  validerConventionHandler,
  genererPdfConventionHandler,
  getStatistiquesHandler,
} from "./universites.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  completeOnboardingUniversiteSchema,
  updateProfilUniversiteSchema,
  validerConventionSchema,
} from "./universites.schema.js";

const router = Router();

router.post(
  "/onboarding",
  requireAuth,
  validate(completeOnboardingUniversiteSchema),
  completeOnboarding,
);

router.get("/moi", requireAuth, requireRole("universite"), getProfile);
router.patch(
  "/moi",
  requireAuth,
  requireRole("universite"),
  validate(updateProfilUniversiteSchema),
  updateProfile,
);
router.get("/stats", requireAuth, requireRole("universite"), getStats);
router.get(
  "/etudiants",
  requireAuth,
  requireRole("universite"),
  listEtudiantsHandler,
);
router.get(
  "/entreprises",
  requireAuth,
  requireRole("universite"),
  listEntreprisesHandler,
);

router.get(
  "/conventions",
  requireAuth,
  requireRole("universite"),
  listConventionsHandler,
);

router.post(
  "/conventions/:id/valider",
  requireAuth,
  requireRole("universite"),
  validate(validerConventionSchema),
  validerConventionHandler,
);
router.get(
  "/conventions/:id/pdf",
  requireAuth,
  requireRole("universite"),
  genererPdfConventionHandler,
);

router.get(
  "/statistiques",
  requireAuth,
  requireRole("universite"),
  getStatistiquesHandler,
);

export default router;
