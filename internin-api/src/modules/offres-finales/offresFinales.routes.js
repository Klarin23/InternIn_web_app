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
import {
  loadAdminProfile,
  requireAdminScope,
} from "../../middlewares/adminScope.middleware.js";
import { ADMIN_SCOPES } from "../administrateurs/adminRbac.js";
import { requireEntrepriseVerifiee } from "../../middlewares/entrepriseVerifiee.middleware.js";
import { requireEquipePermission } from "../equipe/equipe.permissions.js";
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
  requireEquipePermission("candidats.gerer"),
  validate(createOffreFinaleSchema),
  creer,
);

// Historique d'un entretien (côté entreprise)
router.get(
  "/historique/:idEntretien",
  requireAuth,
  requireEntrepriseVerifiee,
  requireEquipePermission("candidats.gerer"),
  historique,
);

// Liste / réponse côté stagiaire
router.get("/mes-offres", requireAuth, listMiennes);
router.patch("/:id/reponse", requireAuth, validate(reponseSchema), repondre);

// Admin
router.get("/", requireAuth, requireRole("administrateur"), loadAdminProfile, requireAdminScope(ADMIN_SCOPES.OFFRES_FINALES), listToutes);
router.get(
  "/en-attente",
  requireAuth,
  requireRole("administrateur"),
  loadAdminProfile,
  requireAdminScope(ADMIN_SCOPES.OFFRES_FINALES),
  listEnAttente,
);
router.patch(
  "/:id/validation",
  requireAuth,
  requireRole("administrateur"),
  loadAdminProfile,
  requireAdminScope(ADMIN_SCOPES.OFFRES_FINALES),
  validate(validationSchema),
  valider,
);

export default router;
