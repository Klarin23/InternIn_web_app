import { z } from "zod";

export const verifierSchema = z
  .object({
    statutVerification: z.enum(["verifiee", "rejetee", "en_attente"]),
    motif: z.string().trim().max(2000).optional(),
    commentaire: z.string().trim().max(2000).optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.statutVerification === "rejetee" &&
      (!data.motif || data.motif.length < 5)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Motif requis (min. 5 caractères) pour un rejet",
        path: ["motif"],
      });
    }
  });

export const statutCompteSchema = z.object({
  statutCompte: z.enum(["actif", "suspendu"], {
    errorMap: () => ({ message: "Statut de compte invalide" }),
  }),
});

// Tous les champs sont optionnels : la page "Paramètres" enregistre un
// toggle ou un champ numérique à la fois (mise à jour partielle).
export const ELEMENTS_VALIDATION_AUTO = [
  "offres_finales",
  "conventions",
  "entreprises",
  "universites",
];

export const updateParametresSchema = z
  .object({
    validationAutomatique: z.boolean(),
    elementsValidationAutomatique: z
      .array(z.enum(ELEMENTS_VALIDATION_AUTO))
      .max(10),
    delaiTraitementHeures: z.number().int().min(1).max(720),
    documentsRequisParEntite: z.number().int().min(0).max(20),
    notificationsEmail: z.boolean(),
    doubleAuthentification: z.boolean(),
    modeMaintenance: z.boolean(),
    messageMaintenance: z.string().trim().max(2000).nullable(),
    maintenanceDebut: z.union([z.string(), z.null()]).optional(),
    maintenanceFin: z.union([z.string(), z.null()]).optional(),
    adminsPeuventAcceder: z.boolean(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Aucun champ à mettre à jour",
  });

export const actionsMasseEntreprisesSchema = z
  .object({
    action: z.enum(["verifier", "rejeter", "suspendre", "reactiver"], {
      errorMap: () => ({ message: "Action groupée invalide" }),
    }),
    ids: z
      .array(z.string().uuid("Identifiant entreprise invalide"))
      .min(1, "Aucune entreprise sélectionnée")
      .max(100, "Maximum 100 entreprises"),
    motif: z.string().trim().max(2000).optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.action === "rejeter" &&
      (!data.motif || data.motif.trim().length < 5)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Motif requis (min. 5 caractères) pour un rejet",
        path: ["motif"],
      });
    }
  });
