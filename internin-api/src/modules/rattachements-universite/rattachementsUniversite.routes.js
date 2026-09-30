import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { rattachementSensitiveLimiter } from "../../middlewares/rateLimit.middleware.js";
import {
  inviterEtudiantSchema,
  codeRattachementSchema,
} from "./rattachementsUniversite.schema.js";
import {
  creerInvitation,
  previewInvitation,
  accepterInvitation,
  refuserInvitation,
  demandesUniversite,
  confirmerDemande,
  refuserDemande,
  rejoindreParCode,
  rejoindreParLien,
  creerCode,
  getCode,
  creerLien,
  getRattachement,
  annulerInvitation,
  revoquerCode,
  revoquerLien,
} from "./rattachementsUniversite.controller.js";

const router = Router();

// Invitation ciblée : la page de prévisualisation ne révèle que le nom de
// l'établissement, jamais l'existence d'un compte étudiant.
router.get("/invitations/:token", rattachementSensitiveLimiter, previewInvitation);
router.post(
  "/invitations/:token/accepter",
  rattachementSensitiveLimiter,
  requireAuth,
  requireRole("stagiaire"),
  accepterInvitation,
);
router.post(
  "/invitations/:token/refuser",
  rattachementSensitiveLimiter,
  requireAuth,
  requireRole("stagiaire"),
  refuserInvitation,
);

router.post(
  "/universites/moi/invitations",
  rattachementSensitiveLimiter,
  requireAuth,
  requireRole("universite"),
  validate(inviterEtudiantSchema),
  creerInvitation,
);
router.get(
  "/universites/moi/demandes",
  requireAuth,
  requireRole("universite"),
  demandesUniversite,
);
router.post(
  "/universites/moi/invitations/:id/annuler",
  requireAuth,
  requireRole("universite"),
  annulerInvitation,
);
router.post(
  "/universites/moi/demandes/:id/confirmer",
  requireAuth,
  requireRole("universite"),
  confirmerDemande,
);
router.post(
  "/universites/moi/demandes/:id/refuser",
  requireAuth,
  requireRole("universite"),
  refuserDemande,
);

router.post(
  "/stagiaires/moi/rattachement/code",
  rattachementSensitiveLimiter,
  requireAuth,
  requireRole("stagiaire"),
  validate(codeRattachementSchema),
  rejoindreParCode,
);
router.post(
  "/stagiaires/moi/rattachement/lien/:token",
  rattachementSensitiveLimiter,
  requireAuth,
  requireRole("stagiaire"),
  rejoindreParLien,
);
router.get(
  "/stagiaires/moi/rattachement",
  requireAuth,
  requireRole("stagiaire"),
  getRattachement,
);

router.post(
  "/universites/moi/code",
  rattachementSensitiveLimiter,
  requireAuth,
  requireRole("universite"),
  creerCode,
);
router.get(
  "/universites/moi/code",
  requireAuth,
  requireRole("universite"),
  getCode,
);
router.post(
  "/universites/moi/lien",
  rattachementSensitiveLimiter,
  requireAuth,
  requireRole("universite"),
  creerLien,
);
router.post(
  "/universites/moi/code/revoquer",
  rattachementSensitiveLimiter,
  requireAuth,
  requireRole("universite"),
  revoquerCode,
);
router.post(
  "/universites/moi/lien/revoquer",
  rattachementSensitiveLimiter,
  requireAuth,
  requireRole("universite"),
  revoquerLien,
);

export default router;
