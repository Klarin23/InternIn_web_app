import { z } from "zod";

export const verifierSchema = z.object({
  statutVerification: z.enum(["verifiee", "rejetee"], {
    errorMap: () => ({ message: "Statut invalide" }),
  }),
});

export const statutCompteSchema = z.object({
  statutCompte: z.enum(["actif", "suspendu"], {
    errorMap: () => ({ message: "Statut de compte invalide" }),
  }),
});

// Tous les champs sont optionnels : la page "Paramètres" enregistre un
// toggle ou un champ numérique à la fois (mise à jour partielle).
export const updateParametresSchema = z
  .object({
    validationAutomatique: z.boolean(),
    delaiTraitementHeures: z.number().int().min(1).max(720),
    documentsRequisParEntite: z.number().int().min(0).max(20),
    notificationsEmail: z.boolean(),
    doubleAuthentification: z.boolean(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Aucun champ à mettre à jour",
  });