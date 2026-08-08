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
} from "./candidatures.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { requireActiveAccount } from "../../middlewares/activeAccount.middleware.js";
import {
  createCandidatureSchema,
  updateStatutSchema,
  evaluationSchema,
  noteSchema,
} from "./candidatures.schema.js";
import { requireEntrepriseVerifiee } from "../../middlewares/entrepriseVerifiee.middleware.js";

const router = Router();

router.post(
  "/",
  requireAuth,
  requireActiveAccount,
  validate(createCandidatureSchema),
  postuler,
);
router.get("/mes-candidatures", requireAuth, requireActiveAccount, listMiennes);
router.get(
  "/entreprise/recommandees",
  requireAuth,
  requireActiveAccount,
  requireEntrepriseVerifiee,
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
  listPourEntreprise,
);
router.patch(
  "/entreprise/:id/statut",
  requireAuth,
  requireEntrepriseVerifiee,
  validate(updateStatutSchema),
  changerStatut,
);
router.patch(
  "/entreprise/entretien/:idEntretien/rejeter",
  requireAuth,
  requireEntrepriseVerifiee,
  rejeterApresEntretien,
);

router.get(
  "/entreprise/:id/historique",
  requireAuth,
  requireEntrepriseVerifiee,
  getHistorique,
);
router.post(
  "/entreprise/:id/cv-consulte",
  requireAuth,
  requireEntrepriseVerifiee,
  consulterCv,
);
router.get(
  "/entreprise/:id/evaluation",
  requireAuth,
  requireEntrepriseVerifiee,
  getEvaluation,
);
router.put(
  "/entreprise/:id/evaluation",
  requireAuth,
  requireEntrepriseVerifiee,
  validate(evaluationSchema),
  updateEvaluation,
);

router.get(
  "/entreprise/:id/notes",
  requireAuth,
  requireEntrepriseVerifiee,
  getNotes,
);
router.post(
  "/entreprise/:id/notes",
  requireAuth,
  validate(noteSchema),
  postNote,
);

export default router;