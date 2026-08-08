import { Router } from "express";
import {
  completeOnboarding,
  getMe,
  updateMe,
  updateMyLogo,
} from "./entreprises.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
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
  validate(completeOnboardingEntrepriseSchema),
  completeOnboarding,
);
router.get("/me", requireAuth, getMe);
router.patch(
  "/me",
  requireAuth,
  validate(updateProfileEntrepriseSchema),
  updateMe,
);
router.post(
  "/me/logo",
  requireAuth,
  (req, res, next) => {
    req.params.type = "logo";
    next();
  },
  upload.single("file"),
  updateMyLogo,
);

export default router;
