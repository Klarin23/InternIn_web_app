import { Router } from "express";
import { creer, getPourStage, toggle } from "./recommandations.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createRecommandationSchema,
  toggleVisibiliteSchema,
} from "./recommandations.schema.js";

const router = Router();

router.post(
  "/stage/:idStage",
  requireAuth,
  validate(createRecommandationSchema),
  creer,
);
router.get("/stage/:idStage", requireAuth, getPourStage);
router.patch(
  "/stage/:idStage/visibilite",
  requireAuth,
  validate(toggleVisibiliteSchema),
  toggle,
);

export default router;
