import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { requireEquipePermission } from "./equipe.permissions.js";
import {
  getMembres,
  getCatalogue,
  postInviterMembre,
  postRenvoyerInvitation,
  deleteInvitation,
  patchMembre,
  patchStatutMembre,
  getAffectations,
  postAffectation,
  deleteAffectation,
  getActivites,
  getParametres,
  patchParametres,
  getInvitation,
  postAccepterInvitation,
  getMoi,
} from "./equipe.controller.js";
import {
  inviterMembreSchema,
  updateMembreSchema,
  updateStatutMembreSchema,
  affecterSuperviseurSchema,
  updateParametresEquipeSchema,
  accepterInvitationSchema,
} from "./equipe.schema.js";

const router = Router();

// Routes publiques (pas de compte encore) — consommées par la page
// /invitation/[token] pour afficher l'invitation puis créer le mot de passe.
router.get("/invitations/:token", getInvitation);
router.post(
  "/invitations/:token/accepter",
  validate(accepterInvitationSchema),
  postAccepterInvitation,
);

router.get("/moi", requireAuth, getMoi);

// L'accès est résolu via req.user.idUtilisateur -> entreprise (propriétaire
// OU membre d'équipe actif, cf. getEntrepriseOrThrow dans equipe.service.js).
// Les routes de LECTURE sont ouvertes à tout membre actif / au propriétaire.
// Les routes de MUTATION sensibles exigent en plus la permission dédiée
// (requireEquipePermission), via le catalogue défini dans equipe.constants.js —
// le propriétaire et un membre "administrateur_principal" ont toujours accès.

router.get("/catalogue", requireAuth, getCatalogue);

router.get("/membres", requireAuth, getMembres);
router.post(
  "/membres/invitations",
  requireAuth,
  requireEquipePermission("equipe.gerer"),
  validate(inviterMembreSchema),
  postInviterMembre,
);
router.post(
  "/membres/:id/invitations/renvoyer",
  requireAuth,
  requireEquipePermission("equipe.gerer"),
  postRenvoyerInvitation,
);
router.delete(
  "/membres/:id/invitations",
  requireAuth,
  requireEquipePermission("equipe.gerer"),
  deleteInvitation,
);
router.patch(
  "/membres/:id",
  requireAuth,
  requireEquipePermission("equipe.gerer"),
  validate(updateMembreSchema),
  patchMembre,
);
router.patch(
  "/membres/:id/statut",
  requireAuth,
  requireEquipePermission("equipe.gerer"),
  validate(updateStatutMembreSchema),
  patchStatutMembre,
);

router.get("/affectations", requireAuth, getAffectations);
router.post(
  "/affectations",
  requireAuth,
  requireEquipePermission("equipe.gerer"),
  validate(affecterSuperviseurSchema),
  postAffectation,
);
router.delete(
  "/affectations/:idStage",
  requireAuth,
  requireEquipePermission("equipe.gerer"),
  deleteAffectation,
);

router.get(
  "/activites",
  requireAuth,
  requireEquipePermission("equipe.gerer"),
  getActivites,
);

router.get("/parametres", requireAuth, getParametres);
router.patch(
  "/parametres",
  requireAuth,
  requireEquipePermission("parametres.gerer"),
  validate(updateParametresEquipeSchema),
  patchParametres,
);

export default router;
