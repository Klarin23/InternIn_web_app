import { z } from "zod";
import { parseStrictDateTime } from "../../utils/dateValidation.js";


// La date limite envoyée par l’API doit contenir une heure. Les valeurs sont
// interprétées comme heure civile Africa/Douala si aucun offset n’est fourni.
const dateLimiteCandidatureSchema = z
  .string()
  .nullable()
  .refine(
    (value) => value == null || value === "" || parseStrictDateTime(value) instanceof Date,
    { message: "Date et heure limites invalides (format date + heure, fuseau Africa/Douala)" },
  )
  .transform((value) => {
    if (value == null || value === "") return null;
    return parseStrictDateTime(value);
  })
  .optional();

const remunerationRules = (data, ctx) => {
  if (data.remunerationType === undefined) return;
  const types = Array.isArray(data.remunerationType) ? data.remunerationType : [data.remunerationType];
  if (new Set(types).size !== types.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Chaque type de rémunération ne peut être sélectionné qu'une seule fois", path: ["remunerationType"] });
  }
  if (types.includes("aucune") && types.length > 1) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Non rémunéré ne peut pas être combiné avec une autre rémunération", path: ["remunerationType"] });
  }
  const paidTypes = types.filter((v) => v !== "aucune");
  if (paidTypes.length > 0) {
    // Le formulaire utilise un montant global pour les types de rémunération sélectionnés.
    // `remunerationMontants` reste accepté pour compatibilité avec d'anciens clients,
    // mais n'est plus requis pour publier une offre.
    const rawAmount = data.montantRemuneration;
    const normalizedAmount =
      typeof rawAmount === "string" ? rawAmount.trim() : rawAmount;
    const amount = Number(normalizedAmount);

    if (
      normalizedAmount === "" ||
      normalizedAmount === null ||
      normalizedAmount === undefined ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Le montant de rémunération doit être supérieur à 0",
        path: ["montantRemuneration"],
      });
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
  dateLimiteCandidature: dateLimiteCandidatureSchema,
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
  dateLimiteCandidature: dateLimiteCandidatureSchema,
  nombrePostes: z.number().min(1).optional(),
  statut: z
    .enum(["brouillon", "publie", "pause", "ferme", "archive"])
    .optional(),
}).superRefine(remunerationRules);