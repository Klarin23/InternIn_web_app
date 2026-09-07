import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { requireSupervisionAccess } from "../../middlewares/supervisionAccess.middleware.js";
import {
  getDashboard,
  getStagiaires,
  getStagiaireDetail,
  getCalendrier,
  postRappelEvaluationHandler,
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

// L'autorisation de niveau route est centralisée ici ; les services
// conservent les contrôles fins de périmètre (affectation du stage / IDOR).
const supervisionGuard = [requireAuth, requireSupervisionAccess];

router.get("/tableau-de-bord", ...supervisionGuard, getDashboard);
router.get("/calendrier", ...supervisionGuard, getCalendrier);
router.get("/stagiaires", ...supervisionGuard, getStagiaires);
router.get("/stagiaires/:idStage", ...supervisionGuard, getStagiaireDetail);
router.post(
  "/stagiaires/:idStage/rappel-evaluation",
  ...supervisionGuard,
  postRappelEvaluationHandler,
);


// Suivi de progression
router.get(
  "/stagiaires/:idStage/progression",
  ...supervisionGuard,
  getProgressionHandler,
);
router.patch(
  "/stagiaires/:idStage/progression",
  ...supervisionGuard,
  validate(updateProgressionSchema),
  patchProgressionHandler,
);

router.post(
  "/stagiaires/:idStage/objectifs",
  ...supervisionGuard,
  validate(ajouterObjectifSchema),
  postObjectifHandler,
);
router.patch(
  "/stagiaires/:idStage/objectifs/:idObjectif",
  ...supervisionGuard,
  validate(updateObjectifSchema),
  patchObjectifHandler,
);
router.delete(
  "/stagiaires/:idStage/objectifs/:idObjectif",
  ...supervisionGuard,
  deleteObjectifHandler,
);

router.post(
  "/stagiaires/:idStage/taches",
  ...supervisionGuard,
  validate(ajouterTacheSchema),
  postTacheHandler,
);
router.patch(
  "/stagiaires/:idStage/taches/:idTache",
  ...supervisionGuard,
  validate(updateTacheSchema),
  patchTacheHandler,
);
router.delete(
  "/stagiaires/:idStage/taches/:idTache",
  ...supervisionGuard,
  deleteTacheHandler,
);

router.post(
  "/stagiaires/:idStage/competences",
  ...supervisionGuard,
  validate(ajouterCompetenceAcquiseSchema),
  postCompetenceHandler,
);
router.delete(
  "/stagiaires/:idStage/competences/:idAcquisition",
  ...supervisionGuard,
  deleteCompetenceHandler,
);

router.post(
  "/stagiaires/:idStage/observations",
  ...supervisionGuard,
  validate(ajouterObservationSchema),
  postObservationHandler,
);
router.delete(
  "/stagiaires/:idStage/observations/:idObservation",
  ...supervisionGuard,
  deleteObservationHandler,
);

// Journal de stage (consultation + modération — la création reste côté
// stagiaire, cf. stages.routes.js)
router.get("/stagiaires/:idStage/journal", ...supervisionGuard, getJournalHandler);
router.patch(
  "/stagiaires/:idStage/journal/:idEntree",
  ...supervisionGuard,
  validate(modererEntreeJournalSchema),
  patchJournalHandler,
);

// Évaluations hebdomadaires. Réutilise la même table que le module
// evaluations/ existant (côté Entreprise), mais avec les permissions et le
// calcul de statut propres au Superviseur (getSuperviseurOrThrow +
// getAffectationOrThrow, cf. superviseur.evaluations.service.js).
router.get("/evaluations", ...supervisionGuard, getEvaluationsHandler);
router.get(
  "/stagiaires/:idStage/evaluations/:idEvaluation",
  ...supervisionGuard,
  getEvaluationDetailHandler,
);
router.post(
  "/stagiaires/:idStage/evaluations",
  ...supervisionGuard,
  validate(enregistrerEvaluationSchema),
  postEvaluationHandler,
);
router.patch(
  "/stagiaires/:idStage/evaluations/:idEvaluation",
  ...supervisionGuard,
  validate(enregistrerEvaluationSchema),
  patchEvaluationHandler,
);

export default router;
