import { Router } from "express";
import {
  planifier,
  listMiens,
  listEntreprise,
  updateEntreprise,
  validerHandler,
  reprogrammerHandler,
  annulerHandler,
  notesPreparationHandler,
  disponibilitesCandidat,
  attenteEntreprise,
} from "./entretiens.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireEntrepriseVerifiee } from "../../middlewares/entrepriseVerifiee.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createEntretienSchema,
  updateEntretienEntrepriseSchema,
  demanderReprogrammationSchema,
  annulerEntretienSchema,
  notesPreparationSchema,
} from "./entretiens.schema.js";
import { requireActiveAccount } from "../../middlewares/activeAccount.middleware.js";

const router = Router();

// Planifier un entretien = action entreprise → entreprise vérifiée obligatoire
router.post(
  "/",
  requireAuth,
  requireEntrepriseVerifiee,
  validate(createEntretienSchema),
  planifier,
);

// Côté stagiaire (pas de requireEntrepriseVerifiee)
router.get("/mes-entretiens", requireAuth, requireActiveAccount, listMiens);

// Côté entreprise
router.get(
  "/entreprise",
  requireAuth,
  requireEntrepriseVerifiee,
  listEntreprise,
);
router.get(
  "/entreprise/en-attente",
  requireAuth,
  requireEntrepriseVerifiee,
  attenteEntreprise,
);
router.patch(
  "/entreprise/:id",
  requireAuth,
  requireEntrepriseVerifiee,
  validate(updateEntretienEntrepriseSchema),
  updateEntreprise,
);

// Actions stagiaire (valider / reprogrammer / annuler / notes)
router.patch("/:id/valider", requireAuth, requireActiveAccount, validerHandler);
router.patch(
  "/:id/reprogrammation",
  requireAuth,
  requireActiveAccount,
  validate(demanderReprogrammationSchema),
  reprogrammerHandler,
);
router.patch(
  "/:id/annuler",
  requireAuth,
  requireActiveAccount,
  validate(annulerEntretienSchema),
  annulerHandler,
);
router.patch(
  "/:id/notes-preparation",
  requireAuth,
  validate(notesPreparationSchema),
  notesPreparationHandler,
);

router.get("/:id/disponibilites-candidat", requireAuth, disponibilitesCandidat);

export default router;
