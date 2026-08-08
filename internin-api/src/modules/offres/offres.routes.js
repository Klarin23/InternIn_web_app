import { Router } from "express";
import {
  listOffres,
  getOffre,
  listMesOffres,
  creerOffre,
  getOffreEntreprise,
  updateOffreHandler,
  deleteOffreHandler,
  dupliquerOffreHandler,
} from "./offres.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireEntrepriseVerifiee } from "../../middlewares/entrepriseVerifiee.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { createOffreSchema, updateOffreSchema } from "./offres.schema.js";

const router = Router();

router.get("/mes-offres", requireAuth, listMesOffres);
router.get("/entreprise/:id", requireAuth, getOffreEntreprise);

// Mutations réservées aux entreprises vérifiées
router.post(
  "/",
  requireAuth,
  requireEntrepriseVerifiee,
  validate(createOffreSchema),
  creerOffre,
);
router.patch(
  "/:id",
  requireAuth,
  requireEntrepriseVerifiee,
  validate(updateOffreSchema),
  updateOffreHandler,
);
router.delete(
  "/:id",
  requireAuth,
  requireEntrepriseVerifiee,
  deleteOffreHandler,
);
router.post(
  "/:id/dupliquer",
  requireAuth,
  requireEntrepriseVerifiee,
  dupliquerOffreHandler,
);

router.get("/", listOffres);
router.get("/:id", getOffre);

export default router;
