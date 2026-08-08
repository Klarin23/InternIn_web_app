import { Router } from "express";
import {
  creer,
  listMiennes,
  historique,
  repondre,
  listToutes,
  listEnAttente,
  valider,
} from "./offresFinales.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { requireEntrepriseVerifiee } from "../../middlewares/entrepriseVerifiee.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createOffreFinaleSchema,
  validationSchema,
  reponseSchema,
} from "./offresFinales.schema.js";

const router = Router();

// Création d'offre finale = entreprise uniquement, et doit être vérifiée
router.post(
  "/",
  requireAuth,
  requireEntrepriseVerifiee,
  validate(createOffreFinaleSchema),
  creer,
);

// Historique d'un entretien (côté entreprise)
router.get(
  "/historique/:idEntretien",
  requireAuth,
  requireEntrepriseVerifiee,
  historique,
);

// Liste / réponse côté stagiaire
router.get("/mes-offres", requireAuth, listMiennes);
router.patch("/:id/reponse", requireAuth, validate(reponseSchema), repondre);

// Admin
router.get("/", requireAuth, requireRole("administrateur"), listToutes);
router.get(
  "/en-attente",
  requireAuth,
  requireRole("administrateur"),
  listEnAttente,
);
router.patch(
  "/:id/validation",
  requireAuth,
  requireRole("administrateur"),
  validate(validationSchema),
  valider,
);

export default router;
