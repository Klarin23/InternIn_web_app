import { z } from "zod";

export const createLitigeSchema = z.object({
  idStage: z.string().min(1),
  typeLitige: z.string().min(1, "Merci de préciser le type de signalement"),
  description: z
    .string()
    .min(10, "Décrivez le problème (10 caractères minimum)"),
});

export const changerStatutLitigeSchema = z.object({
  statut: z.enum(["ouvert", "en_cours", "resolu", "rejete"], {
    errorMap: () => ({ message: "Statut invalide" }),
  }),
});
