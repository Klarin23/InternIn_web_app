import { Router } from "express";
import { upload } from "../../utils/upload.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import {
  uploadDocument,
  downloadDocument,
  downloadCvByStagiaire,
} from "./documents.controller.js";
import {
  uploadLimiter,
  downloadLimiter,
} from "../../middlewares/rateLimit.middleware.js";

const router = Router();

router.post(
  "/upload/:type",
  requireAuth,
  uploadLimiter,
  upload.single("file"),
  uploadDocument,
);

// Accès CV par id stagiaire (préféré pour les clients entreprise)
router.get(
  "/cv/stagiaire/:idStagiaire",
  requireAuth,
  downloadLimiter,
  downloadCvByStagiaire,
);

// Téléchargement / consultation par type + filename (compat historique)
router.get(
  "/download/:type/:filename",
  requireAuth,
  downloadLimiter,
  downloadDocument,
);

export default router;
