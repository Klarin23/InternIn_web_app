import { Router } from "express";
import {
  monStage,
  mesStages,
  terminer,
  certificat,
  verifier,
  getJournal,
  postJournal,
  patchJournal,
  deleteJournal,
} from "./stages.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  ajouterEntreeJournalSchema,
  updateEntreeJournalSchema,
} from "./stages.schema.js";
import { requireActiveAccount } from "../../middlewares/activeAccount.middleware.js";



const router = Router();

router.get("/mon-stage", requireAuth, requireActiveAccount, monStage);
router.get("/mes-stages", requireAuth, requireActiveAccount, mesStages);
router.patch("/:id/terminer", requireAuth, requireActiveAccount, terminer);
router.get(
  "/:idStage/certificat",
  requireAuth,
  requireActiveAccount,
  certificat,
);
router.get("/verifier/:code", verifier); // publique, pas de requireAuth : vérification d'un certificat par un tiers (ex: recruteur)

// Journal de stage / activités (côté stagiaire — la modération par le
// superviseur se fait via /superviseur/stagiaires/:idStage/journal)
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
