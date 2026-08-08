import { Router } from "express";
import {
  lister,
  compter,
  marquerLue,
  marquerTouteslues,
  supprimer,
  supprimerToutes,
} from "./notifications.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/", requireAuth, lister);
router.get("/non-lues/compte", requireAuth, compter);
router.patch("/:id/lue", requireAuth, marquerLue);
router.patch("/lues-toutes", requireAuth, marquerTouteslues);
// Route "toutes" déclarée AVANT "/:id" pour ne pas être interceptée par elle.
router.delete("/toutes", requireAuth, supprimerToutes);
router.delete("/:id", requireAuth, supprimer);

export default router;
