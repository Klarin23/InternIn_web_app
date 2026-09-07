import { Router } from "express";
import {
  monStage,
  mesStages,
  terminer,
  certificat,
  mesCertificats,
  downloadCertificat,
  verifier,
  getJournal,
  postJournal,
  patchJournal,
  deleteJournal,
  corrigerDates,
} from "./stages.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  ajouterEntreeJournalSchema,
  updateEntreeJournalSchema,
  corrigerDatesStageSchema,
} from "./stages.schema.js";
import { requireActiveAccount } from "../../middlewares/activeAccount.middleware.js";
import { requireEquipePermission } from "../equipe/equipe.permissions.js";

const router = Router();

// Publique — avant requireAuth
router.get("/verifier/:code", verifier);

router.get("/mon-stage", requireAuth, requireActiveAccount, monStage);
router.get("/mes-stages", requireAuth, requireActiveAccount, mesStages);
router.get(
  "/mes-certificats",
  requireAuth,
  requireActiveAccount,
  mesCertificats,
);
router.patch("/:id/terminer", requireAuth, requireActiveAccount, terminer);
router.get(
  "/:idStage/certificat",
  requireAuth,
  requireActiveAccount,
  certificat,
);
router.get(
  "/:idStage/certificat/download",
  requireAuth,
  requireActiveAccount,
  downloadCertificat,
);

router.patch(
  "/:idStage/corriger-dates",
  requireAuth,
  requireActiveAccount,
  requireEquipePermission("stagiaires.suivre"),
  validate(corrigerDatesStageSchema),
  corrigerDates,
);

router.get("/:idStage/journal", requireAuth, requireActiveAccount, getJournal);
router.post(
  "/:idStage/journal",
  requireAuth,
  requireActiveAccount,
  validate(ajouterEntreeJournalSchema),
  postJournal,
);
router.patch(
  "/:idStage/journal/:idEntree",
  requireAuth,
  requireActiveAccount,
  validate(updateEntreeJournalSchema),
  patchJournal,
);
router.delete(
  "/:idStage/journal/:idEntree",
  requireAuth,
  requireActiveAccount,
  deleteJournal,
);

export default router;
