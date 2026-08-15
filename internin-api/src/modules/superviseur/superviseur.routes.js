import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  getDashboard,
  getStagiaires,
  getStagiaireDetail,
  getCalendrier,
} from "./superviseur.controller.js";
import {
  getProgressionHandler,
  patchProgressionHandler,
  postObjectifHandler,
  patchObjectifHandler,
  deleteObjectifHandler,
  postTacheHandler,
  patchTacheHandler,
  deleteTacheHandler,
  postCompetenceHandler,
  deleteCompetenceHandler,
  postObservationHandler,
  deleteObservationHandler,
  getJournalHandler,
  patchJournalHandler,
} from "./superviseur.progression.controller.js";
import {
  ajouterObjectifSchema,
  updateObjectifSchema,
  ajouterTacheSchema,
  updateTacheSchema,
  ajouterCompetenceAcquiseSchema,
  ajouterObservationSchema,
  updateProgressionSchema,
  modererEntreeJournalSchema,
} from "./superviseur.progression.schema.js";
import {
  getEvaluationsHandler,
  getEvaluationDetailHandler,
  postEvaluationHandler,
  patchEvaluationHandler,
} from "./superviseur.evaluations.controller.js";
import { enregistrerEvaluationSchema } from "./superviseur.evaluations.schema.js";

const router = Router();

// L'accès est vérifié dans le service : le compte doit être un membre
// d'équipe actif avec roleEquipe="superviseur" (cf. getSuperviseurOrThrow),
// et pour toutes les routes /stagiaires/:idStage/..., que ce stage lui soit
// bien affecté (cf. getAffectationOrThrow).
router.get("/tableau-de-bord", requireAuth, getDashboard);
router.get("/calendrier", requireAuth, getCalendrier);
router.get("/stagiaires", requireAuth, getStagiaires);
router.get("/stagiaires/:idStage", requireAuth, getStagiaireDetail);

// Suivi de progression
router.get(
  "/stagiaires/:idStage/progression",
  requireAuth,
  getProgressionHandler,
);
router.patch(
  "/stagiaires/:idStage/progression",
  requireAuth,
  validate(updateProgressionSchema),
  patchProgressionHandler,
);

router.post(
  "/stagiaires/:idStage/objectifs",
  requireAuth,
  validate(ajouterObjectifSchema),
  postObjectifHandler,
);
router.patch(
  "/stagiaires/:idStage/objectifs/:idObjectif",
  requireAuth,
  validate(updateObjectifSchema),
  patchObjectifHandler,
);
router.delete(
  "/stagiaires/:idStage/objectifs/:idObjectif",
  requireAuth,
  deleteObjectifHandler,
);

router.post(
  "/stagiaires/:idStage/taches",
  requireAuth,
  validate(ajouterTacheSchema),
  postTacheHandler,
);
router.patch(
  "/stagiaires/:idStage/taches/:idTache",
  requireAuth,
  validate(updateTacheSchema),
  patchTacheHandler,
);
router.delete(
  "/stagiaires/:idStage/taches/:idTache",
  requireAuth,
  deleteTacheHandler,
);

router.post(
  "/stagiaires/:idStage/competences",
  requireAuth,
  validate(ajouterCompetenceAcquiseSchema),
  postCompetenceHandler,
);
router.delete(
  "/stagiaires/:idStage/competences/:idAcquisition",
  requireAuth,
  deleteCompetenceHandler,
);

router.post(
  "/stagiaires/:idStage/observations",
  requireAuth,
  validate(ajouterObservationSchema),
  postObservationHandler,
);
router.delete(
  "/stagiaires/:idStage/observations/:idObservation",
  requireAuth,
  deleteObservationHandler,
);

// Journal de stage (consultation + modération — la création reste côté
// stagiaire, cf. stages.routes.js)
router.get("/stagiaires/:idStage/journal", requireAuth, getJournalHandler);
router.patch(
  "/stagiaires/:idStage/journal/:idEntree",
  requireAuth,
  validate(modererEntreeJournalSchema),
  patchJournalHandler,
);

// Évaluations hebdomadaires. Réutilise la même table que le module
// evaluations/ existant (côté Entreprise), mais avec les permissions et le
// calcul de statut propres au Superviseur (getSuperviseurOrThrow +
// getAffectationOrThrow, cf. superviseur.evaluations.service.js).
router.get("/evaluations", requireAuth, getEvaluationsHandler);
router.get(
  "/stagiaires/:idStage/evaluations/:idEvaluation",
  requireAuth,
  getEvaluationDetailHandler,
);
router.post(
  "/stagiaires/:idStage/evaluations",
  requireAuth,
  validate(enregistrerEvaluationSchema),
  postEvaluationHandler,
);
router.patch(
  "/stagiaires/:idStage/evaluations/:idEvaluation",
  requireAuth,
  validate(enregistrerEvaluationSchema),
  patchEvaluationHandler,
);

export default router;
