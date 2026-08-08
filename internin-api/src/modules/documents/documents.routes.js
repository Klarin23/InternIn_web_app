import { Router } from "express";
import { upload } from "../../utils/upload.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { uploadDocument, downloadDocument } from "./documents.controller.js";
import { uploadLimiter } from "../../middlewares/rateLimit.middleware.js";

const router = Router();

router.post(
  "/upload/:type",
  requireAuth,
  uploadLimiter,
  upload.single("file"),
  uploadDocument,
);

router.get("/download/:type/:filename", requireAuth, downloadDocument);

export default router;
