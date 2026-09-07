import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireEquipePermission } from "../equipe/equipe.permissions.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createPropositionSchema,
  updatePropositionSchema,
} from "./propositions.schema.js";
import {
  getTalents,
  getTalent,
  postProposition,
  getPropositionsEntreprise,
  getPropositionsStagiaire,
  patchProposition,
  deleteProposition,
} from "./propositions.controller.js";

const router = Router();

// Talents discovery (entreprise only)
router.get(
  "/talents",
  requireAuth,
  requireEquipePermission("talents.voir"),
  getTalents,
);
router.get(
  "/talents/:id",
  requireAuth,
  requireEquipePermission("talents.voir"),
  getTalent,
);

// Propositions
// Création / envoi : talents.proposer (équivalent propositions.creer)
router.post(
  "/",
  requireAuth,
  requireEquipePermission("talents.proposer"),
  validate(createPropositionSchema),
  postProposition,
);

// Liste entreprise : talents.voir (équivalent propositions.voir)
router.get(
  "/entreprise",
  requireAuth,
  requireEquipePermission("talents.voir"),
  getPropositionsEntreprise,
);

// Liste stagiaire : pas de permission équipe (espace stagiaire)
router.get("/stagiaire", requireAuth, getPropositionsStagiaire);

// PATCH partagé stagiaire (accept/refus) / entreprise (annulation, vue…)
// La permission équipe est vérifiée dans le controller côté entreprise uniquement.
router.patch(
  "/:id",
  requireAuth,
  validate(updatePropositionSchema),
  patchProposition,
);

// Suppression / annulation administrative : talents.proposer
// (équivalent propositions.gerer / propositions.modifier pour le cycle de vie)
router.delete(
  "/:id",
  requireAuth,
  requireEquipePermission("talents.proposer"),
  deleteProposition,
);

export default router;
