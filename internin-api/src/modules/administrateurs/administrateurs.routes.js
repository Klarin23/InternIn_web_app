// Toutes les routes de ce module exigent le rôle "administrateur" —
// aucune autre personne connectée ne doit pouvoir y accéder.

import { Router } from "express";
import {
  listEntreprises,
  listUniversites,
  listToutesEntreprisesHandler,
  changerStatutCompteHandler,
  listToutesUniversitesHandler,
  changerStatutCompteUniversiteHandler,
  verifierEntrepriseHandler,
  verifierUniversiteHandler,
  listTousUtilisateursHandler,
  changerStatutCompteUtilisateurHandler,
  getStats,
  moi,
  getParametresHandler,
  updateParametresHandler,
  listDocumentsEntrepriseHandler,
} from "./administrateurs.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  verifierSchema,
  statutCompteSchema,
  updateParametresSchema,
} from "./administrateurs.schema.js";

const router = Router();

router.use(requireAuth, requireRole("administrateur"));

router.get("/moi", moi);
router.get("/stats", getStats);
router.get("/parametres", getParametresHandler);
router.patch(
  "/parametres",
  validate(updateParametresSchema),
  updateParametresHandler,
);
// Routes spécifiques d'abord, "/entreprises" et "/universites" génériques en dernier
router.get("/entreprises/en-attente", listEntreprises);
router.get("/universites/en-attente", listUniversites);
router.get("/entreprises", listToutesEntreprisesHandler);
router.get("/universites", listToutesUniversitesHandler);
router.get("/utilisateurs", listTousUtilisateursHandler);
router.patch(
  "/utilisateurs/:id/statut-compte",
  validate(statutCompteSchema),
  changerStatutCompteUtilisateurHandler,
);
router.patch(
  "/entreprises/:id/verification",
  validate(verifierSchema),
  verifierEntrepriseHandler,
);
router.patch(
  "/entreprises/:id/statut-compte",
  validate(statutCompteSchema),
  changerStatutCompteHandler,
);
router.get("/entreprises/:id/documents", listDocumentsEntrepriseHandler);


router.patch(
  "/universites/:id/verification",
  validate(verifierSchema),
  verifierUniversiteHandler,
);
router.patch(
  "/universites/:id/statut-compte",
  validate(statutCompteSchema),
  changerStatutCompteUniversiteHandler,
);

export default router;
