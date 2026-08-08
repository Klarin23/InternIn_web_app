import { z } from "zod";

export const ajouterObjectifSchema = z.object({
  description: z.string().min(1, "La description est requise"),
});

export const updateObjectifSchema = z.object({
  description: z.string().min(1).optional(),
  statut: z.enum(["defini", "realise"]).optional(),
});

export const ajouterTacheSchema = z.object({
  description: z.string().min(1, "La description est requise"),
});

export const updateTacheSchema = z.object({
  description: z.string().min(1).optional(),
  statut: z.enum(["a_faire", "terminee"]).optional(),
});

export const ajouterCompetenceAcquiseSchema = z.object({
  idCompetence: z.string().uuid("Compétence invalide"),
});

export const ajouterObservationSchema = z.object({
  contenu: z.string().min(1, "L'observation ne peut pas être vide"),
});

export const updateProgressionSchema = z.object({
  progressionPourcentage: z
    .number()
    .min(0, "La progression doit être comprise entre 0 et 100")
    .max(100, "La progression doit être comprise entre 0 et 100"),
});

export const modererEntreeJournalSchema = z.object({
  statutValidation: z.enum(["validee", "correction_demandee", "terminee"], {
    errorMap: () => ({ message: "Statut invalide" }),
  }),
  commentaireSuperviseur: z.string().optional(),
});
