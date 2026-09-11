import { z } from "zod";
import { parseStrictYmd } from "../../utils/dateValidation.js";

const remunerationRules = (data, ctx) => {
  if (data.remunerationType === undefined) return;
  const types = Array.isArray(data.remunerationType) ? data.remunerationType : [data.remunerationType];
  if (new Set(types).size !== types.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Chaque type de rémunération ne peut être sélectionné qu'une seule fois", path: ["remunerationType"] });
  }
  if (types.includes("aucune") && types.length > 1) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Non rémunéré ne peut pas être combiné avec une autre rémunération", path: ["remunerationType"] });
  }
  for (const type of types.filter((v) => v !== "aucune")) {
    const amount = Number(data.remunerationMontants?.[type]);
    if (!Number.isFinite(amount) || amount <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Le montant de chaque rémunération est requis et doit être supérieur à 0", path: ["remunerationMontants", type] });
    }
  }
};

export const createOffreSchema = z.object({
  titre: z.string().min(1, "Le titre est requis"),
  departement: z.string().optional(),
  secteurActivite: z.string().min(1, "Le secteur d'activité est requis"),
  description: z
    .string()
    .min(20, "Décrivez le stage en quelques phrases (20 caractères minimum)"),
  responsabilites: z.string().optional(),
  competencesRequises: z.string().optional(),
  opportunitesApprentissage: z.string().optional(),
  modeTravail: z.enum(["distance", "hybride", "presentiel"], {
    errorMap: () => ({ message: "Sélectionnez un mode de travail" }),
  }),
  remunerationType: z.array(z.enum([
    "aucune", "indemnite_transport", "indemnite_repas",
    "allocation_mensuelle", "indemnite_internet_appel",
  ])).min(1, "Sélectionnez au moins un type de rémunération"),
  remunerationMontants: z.record(z.string(), z.string()).optional(),
  montantRemuneration: z.string().nullable().optional(),
  dureeStage: z.enum(["1_mois", "2_mois", "3_mois"]).optional(),
  dateLimiteCandidature: z
    .string()
    .nullable()
    .optional()
    .refine(
      (v) => v == null || v === "" || parseStrictYmd(v) != null,
      { message: "Date limite invalide (AAAA-MM-JJ, date calendaire réelle)" },
    ),
  nombrePostes: z.number().min(1, "Au moins 1 poste").default(1),
  statut: z.enum(["brouillon", "publie"]).default("brouillon"),
}).superRefine(remunerationRules);

export const updateOffreSchema = z.object({
  titre: z.string().min(1).optional(),
  departement: z.string().optional(),
  secteurActivite: z.string().min(1).optional(),
  description: z.string().min(20).optional(),
  responsabilites: z.string().optional(),
  competencesRequises: z.string().optional(),
  opportunitesApprentissage: z.string().optional(),
  modeTravail: z.enum(["distance", "hybride", "presentiel"]).optional(),
  remunerationType: z.union([
    z.array(z.enum([
      "aucune", "indemnite_transport", "indemnite_repas",
      "allocation_mensuelle", "indemnite_internet_appel",
    ])).min(1),
    z.enum([
      "aucune", "indemnite_transport", "indemnite_repas",
      "allocation_mensuelle", "indemnite_internet_appel",
    ]),
  ]).optional(),
  remunerationMontants: z.record(z.string(), z.string()).optional(),
  montantRemuneration: z.string().nullable().optional(),
  dureeStage: z.enum(["1_mois", "2_mois", "3_mois"]).optional(),
  dateLimiteCandidature: z
    .string()
    .nullable()
    .optional()
    .refine(
      (v) => v == null || v === "" || parseStrictYmd(v) != null,
      { message: "Date limite invalide (AAAA-MM-JJ, date calendaire réelle)" },
    ),
  nombrePostes: z.number().min(1).optional(),
  statut: z
    .enum(["brouillon", "publie", "pause", "ferme", "archive"])
    .optional(),
}).superRefine(remunerationRules);