import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import {
  getFavoris,
  getFavorisCount,
  postFavori,
  deleteFavori,
  getIsFavori,
} from "./favoris.controller.js";

const router = Router();

router.get("/", requireAuth, getFavoris);
router.get("/count", requireAuth, getFavorisCount);
router.get("/:idOffre/status", requireAuth, getIsFavori);
router.post("/:idOffre", requireAuth, postFavori);
router.delete("/:idOffre", requireAuth, deleteFavori);

export default router;
