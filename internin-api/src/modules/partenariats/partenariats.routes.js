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
import { requireEquipePermission } from "../equipe/equipe.permissions.js";
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
// Côté entreprise : propriétaire OU membre_entreprise actif avec partenariats.gerer
router.get(
  "/recues",
  requireAuth,
  requireEntrepriseVerifiee,
  requireEquipePermission("partenariats.gerer"),
  invitationsRecues,
);
router.get(
  "/mes-universites-partenaires",
  requireAuth,
  requireEntrepriseVerifiee,
  requireEquipePermission("partenariats.gerer"),
  universitesPartenaires,
);
router.patch(
  "/:id/reponse",
  requireAuth,
  requireEntrepriseVerifiee,
  requireEquipePermission("partenariats.gerer"),
  validate(repondreInvitationSchema),
  repondre,
);

export default router;
