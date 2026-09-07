import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import {
  getEtatVueHandler,
  markEtatVueHandler,
} from "./etatsVue.controller.js";

const router = Router();

router.get("/:ressource", requireAuth, getEtatVueHandler);
router.patch("/:ressource", requireAuth, markEtatVueHandler);

export default router;
