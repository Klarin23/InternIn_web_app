import { z } from "zod";

export const createCandidatureSchema = z.object({
  idOffre: z.string().min(1, "Offre invalide"),
  lettreMotivation: z.string().optional(),
});

export const updateStatutSchema = z.object({
  statut: z.enum(["consultee", "preselectionnee", "rejetee", "acceptee"], {
    errorMap: () => ({ message: "Statut invalide" }),
  }),
});

export const evaluationSchema = z.object({
  noteGlobale: z.number().min(1).max(5).optional(),
  motivation: z.number().min(1).max(5).optional(),
  communication: z.number().min(1).max(5).optional(),
  technique: z.number().min(1).max(5).optional(),
  presentation: z.number().min(1).max(5).optional(),
});

export const noteSchema = z.object({
  contenu: z.string().min(1, "La note ne peut pas être vide").max(2000),
});