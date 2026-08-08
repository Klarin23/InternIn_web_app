import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { upload } from "../../utils/upload.js";
import {
  completeOnboardingSchema,
  updateProfileSchema,
} from "./stagiaires.schema.js";
import {
  completeOnboarding,
  getMe,
  updateMe,
  updateMyPhoto,
} from "./stagiaires.controller.js";

const router = Router();

router.post(
  "/onboarding",
  requireAuth,
  validate(completeOnboardingSchema),
  completeOnboarding,
);

router.get("/me", requireAuth, getMe);
router.patch("/me", requireAuth, validate(updateProfileSchema), updateMe);
// Le middleware `upload` (utils/upload.js) est partagé avec le module
// documents et choisit le sous-dossier de destination à partir de
// req.params.type — un paramètre qui n'existe que sur les routes de la
// forme "/upload/:type" (cf. documents.routes.js). Cette route n'a pas de
// tel paramètre, donc sans cette étape req.params.type est undefined et
// l'upload échoue systématiquement avec "Type de document invalide" (400).
// On force donc explicitement le sous-dossier "photo_profil" avant
// d'appeler le middleware partagé.
router.post(
  "/me/photo",
  requireAuth,
  (req, res, next) => {
    req.params.type = "photo_profil";
    next();
  },
  upload.single("file"),
  updateMyPhoto,
);

export default router;
