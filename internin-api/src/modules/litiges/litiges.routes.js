import { Router } from "express";
import { creer, lister, changerStatut } from "./litiges.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createLitigeSchema,
  changerStatutLitigeSchema,
} from "./litiges.schema.js";

const router = Router();
router.post("/", requireAuth, validate(createLitigeSchema), creer);
router.get("/", requireAuth, requireRole("administrateur"), lister);
router.patch(
  "/:id/statut",
  requireAuth,
  requireRole("administrateur"),
  validate(changerStatutLitigeSchema),
  changerStatut,
);

export default router;
