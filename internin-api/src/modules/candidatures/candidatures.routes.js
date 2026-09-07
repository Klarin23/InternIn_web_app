import { Router } from "express";
import {
  postuler,
  listMiennes,
  getStatutPourOffre,
  listPourEntreprise,
  changerStatut,
  rejeterApresEntretien,
  listRecommandes,
  getHistorique,
  consulterCv,
  getEvaluation,
  updateEvaluation,
  getNotes,
  postNote,
  retirer,
} from "./candidatures.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { requireActiveAccount } from "../../middlewares/activeAccount.middleware.js";
import {
  createCandidatureSchema,
  updateStatutSchema,
  evaluationSchema,
  noteSchema,
  retirerCandidatureSchema,
} from "./candidatures.schema.js";
import { requireEntrepriseVerifiee } from "../../middlewares/entrepriseVerifiee.middleware.js";
import { requireEquipePermission } from "../equipe/equipe.permissions.js";

const router = Router();

router.post(
  "/",
  requireAuth,
  requireActiveAccount,
  validate(createCandidatureSchema),
  postuler,
);
router.get("/mes-candidatures", requireAuth, requireActiveAccount, listMiennes);
router.post(
  "/:id/retirer",
  requireAuth,
  requireActiveAccount,
  validate(retirerCandidatureSchema),
  retirer,
);
router.get(
  "/entreprise/recommandees",
  requireAuth,
  requireActiveAccount,
  requireEntrepriseVerifiee,
  requireEquipePermission("candidats.gerer"),
  listRecommandes,
);
router.get(
  "/statut/:idOffre",
  requireAuth,
  requireActiveAccount,
  getStatutPourOffre,
);
router.get(
  "/entreprise",
  requireAuth,
  requireEntrepriseVerifiee,
  requireEquipePermission("candidats.gerer"),
  listPourEntreprise,
);
router.patch(
  "/entreprise/:id/statut",
  requireAuth,
  requireEntrepriseVerifiee,
  requireEquipePermission("candidats.gerer"),
  validate(updateStatutSchema),
  changerStatut,
);
router.patch(
  "/entreprise/entretien/:idEntretien/rejeter",
  requireAuth,
  requireEntrepriseVerifiee,
  requireEquipePermission("candidats.gerer"),
  rejeterApresEntretien,
);

router.get(
  "/entreprise/:id/historique",
  requireAuth,
  requireEntrepriseVerifiee,
  requireEquipePermission("candidats.gerer"),
  getHistorique,
);
router.post(
  "/entreprise/:id/cv-consulte",
  requireAuth,
  requireEntrepriseVerifiee,
  requireEquipePermission("candidats.gerer"),
  consulterCv,
);
router.get(
  "/entreprise/:id/evaluation",
  requireAuth,
  requireEntrepriseVerifiee,
  requireEquipePermission("candidats.gerer"),
  getEvaluation,
);
router.put(
  "/entreprise/:id/evaluation",
  requireAuth,
  requireEntrepriseVerifiee,
  requireEquipePermission("candidats.gerer"),
  validate(evaluationSchema),
  updateEvaluation,
);

router.get(
  "/entreprise/:id/notes",
  requireAuth,
  requireEntrepriseVerifiee,
  requireEquipePermission("candidats.gerer"),
  getNotes,
);
router.post(
  "/entreprise/:id/notes",
  requireAuth,
  requireEntrepriseVerifiee,
  requireEquipePermission("candidats.gerer"),
  validate(noteSchema),
  postNote,
);

export default router;
