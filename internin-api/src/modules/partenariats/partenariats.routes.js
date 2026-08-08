import { Router } from "express";
import {
  decouvrirEntreprises,
  inviter,
  invitationsEnvoyees,
  invitationsRecues,
  repondre,
  universitesPartenaires,
} from "./partenariats.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { requireEntrepriseVerifiee } from "../../middlewares/entrepriseVerifiee.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  envoyerInvitationSchema,
  repondreInvitationSchema,
} from "./partenariats.schema.js";

const router = Router();

// Côté université
router.get(
  "/entreprises-disponibles",
  requireAuth,
  requireRole("universite"),
  decouvrirEntreprises,
);
router.get(
  "/mes-invitations-envoyees",
  requireAuth,
  requireRole("universite"),
  invitationsEnvoyees,
);
router.post(
  "/",
  requireAuth,
  requireRole("universite"),
  validate(envoyerInvitationSchema),
  inviter,
);

// Côté entreprise — lecture + réponse uniquement si vérifiée
router.get(
  "/recues",
  requireAuth,
  requireRole("entreprise"),
  requireEntrepriseVerifiee,
  invitationsRecues,
);
router.get(
  "/mes-universites-partenaires",
  requireAuth,
  requireRole("entreprise"),
  requireEntrepriseVerifiee,
  universitesPartenaires,
);
router.patch(
  "/:id/reponse",
  requireAuth,
  requireRole("entreprise"),
  requireEntrepriseVerifiee,
  validate(repondreInvitationSchema),
  repondre,
);

export default router;
