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
import { requireAuth, optionalAuth } from "../../middlewares/auth.middleware.js";
import { requireEntrepriseVerifiee } from "../../middlewares/entrepriseVerifiee.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { createOffreSchema, updateOffreSchema } from "./offres.schema.js";
import { requireEquipePermission } from "../equipe/equipe.permissions.js";

const router = Router();

// Lecture pour l'entreprise (membre actif ou propriétaire)
router.get("/mes-offres", requireAuth, listMesOffres);
router.get("/entreprise/:id", requireAuth, getOffreEntreprise);

// Mutations : authentifié + entreprise vérifiée + permission offres.gerer
router.post(
  "/",
  requireAuth,
  requireEntrepriseVerifiee,
  requireEquipePermission("offres.gerer"),
  validate(createOffreSchema),
  creerOffre,
);
router.patch(
  "/:id",
  requireAuth,
  requireEntrepriseVerifiee,
  requireEquipePermission("offres.gerer"),
  validate(updateOffreSchema),
  updateOffreHandler,
);
router.delete(
  "/:id",
  requireAuth,
  requireEntrepriseVerifiee,
  requireEquipePermission("offres.gerer"),
  deleteOffreHandler,
);
router.post(
  "/:id/dupliquer",
  requireAuth,
  requireEntrepriseVerifiee,
  requireEquipePermission("offres.gerer"),
  dupliquerOffreHandler,
);

// Catalogue public
router.get("/", optionalAuth, listOffres);
router.get("/:id", optionalAuth, getOffre);

export default router;
