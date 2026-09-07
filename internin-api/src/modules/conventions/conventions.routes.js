import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { requireActiveAccount } from "../../middlewares/activeAccount.middleware.js";
import {
  requireEquipePermission,
  requireAnyEquipePermission,
} from "../equipe/equipe.permissions.js";
import {
  maConvention,
  signer,
  pdf,
  listEntreprise,
  statsEntreprise,
  actionsRequisesEntreprise,
  detailEntreprise,
  signerEntreprise,
  pdfEntreprise,
} from "./conventions.controller.js";

const router = Router();

// ── Stagiaire (anti-IDOR : convention résolue serveur-side) ─────────────────
router.get(
  "/moi",
  requireAuth,
  requireRole("stagiaire"),
  requireActiveAccount,
  maConvention,
);

router.post(
  "/moi/signer",
  requireAuth,
  requireRole("stagiaire"),
  requireActiveAccount,
  signer,
);

router.get(
  "/moi/pdf",
  requireAuth,
  requireRole("stagiaire"),
  requireActiveAccount,
  pdf,
);

// ── Entreprise ─────────────────────────────────────────────────────────────
const voirConv = requireAnyEquipePermission(
  "conventions.voir",
  "conventions.gerer",
  "stagiaires.suivre",
);

router.get("/entreprise", requireAuth, voirConv, listEntreprise);
router.get("/entreprise/stats", requireAuth, voirConv, statsEntreprise);
router.get(
  "/entreprise/actions-requises",
  requireAuth,
  voirConv,
  actionsRequisesEntreprise,
);
router.get("/entreprise/:id", requireAuth, voirConv, detailEntreprise);
router.get("/entreprise/:id/pdf", requireAuth, voirConv, pdfEntreprise);

router.post(
  "/entreprise/:id/signer",
  requireAuth,
  requireEquipePermission("conventions.gerer"),
  signerEntreprise,
);

export default router;
