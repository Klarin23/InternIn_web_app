import { z } from "zod";

const CATEGORIES = [
  "harassment",
  "discrimination",
  "inappropriate_behavior",
  "unsafe_working_conditions",
  "contract_internship_issue",
  "payment_issue",
  "abuse_of_authority",
  "privacy_concern",
  "other",
];

const SEVERITIES = ["faible", "moyen", "eleve", "critique"];

export const STATUTS_LITIGE = ["ouvert", "en_cours", "resolu", "rejete"];

/** Transitions autorisées — workflow Safety & Reporting (statuts DB existants) */
export const TRANSITIONS_LITIGE = {
  ouvert: ["en_cours", "rejete"],
  en_cours: ["resolu", "rejete", "ouvert"],
  resolu: ["ouvert"],
  rejete: ["ouvert"],
};

export const createLitigeSchema = z.object({
  idStage: z.string().uuid("Stage invalide"),
  typeLitige: z.string().min(1).max(150).optional(),
  cibleType: z.enum(["entreprise", "superviseur"]).optional(),
  categorie: z.enum(CATEGORIES).optional(),
  severite: z.enum(SEVERITIES).optional(),
  dateIncident: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide (YYYY-MM-DD)")
    .optional()
    .nullable(),
  description: z
    .string()
    .min(10, "Décrivez le problème (10 caractères minimum)")
    .max(8000, "Description trop longue"),
});

export const changerStatutLitigeSchema = z.object({
  statut: z.enum(["ouvert", "en_cours", "resolu", "rejete"], {
    errorMap: () => ({ message: "Statut invalide" }),
  }),
  /** Motif obligatoire pour résolution / rejet (audit + traçabilité) */
  motif: z.string().max(2000).optional().nullable(),
});

export { CATEGORIES, SEVERITIES };

export const noteInterneSchema = z.object({
  contenu: z.string().min(2).max(4000),
});

export const messageLitigeSchema = z.object({
  contenu: z.string().min(2).max(4000),
});

export const escaladeLitigeSchema = z.object({
  motif: z.string().min(5).max(2000),
});

export const requestInfoSchema = z.object({
  message: z.string().min(5).max(4000),
});


export const actionDisciplinaireSchema = z.object({
  type: z.enum(["avertissement", "suspendre_entreprise"]),
  motif: z.string().min(5).max(2000),
});
