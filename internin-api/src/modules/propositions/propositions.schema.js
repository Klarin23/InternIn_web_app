import { z } from "zod";

export const createPropositionSchema = z.object({
  idStagiaire: z.string().uuid("Stagiaire invalide"),
  idOffre: z.string().uuid("Offre invalide"),
  message: z
    .string()
    .max(1000, "Le message ne peut pas dépasser 1000 caractères")
    .optional()
    .nullable(),
});

// "statut" = ACTION demandée par le client (pas une écriture libre en DB).
// La machine à états serveur décide si la transition est autorisée.
export const updatePropositionSchema = z.object({
  statut: z.enum(["vue", "acceptee", "refusee", "annulee"], {
    errorMap: () => ({ message: "Action de proposition invalide" }),
  }),
  commentaireReponse: z
    .string()
    .max(2000, "Le motif ne peut pas dépasser 2000 caractères")
    .optional()
    .nullable(),
});
