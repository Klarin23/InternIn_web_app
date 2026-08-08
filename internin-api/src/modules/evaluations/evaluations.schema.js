import { z } from "zod";

export const createEvaluationSchema = z.object({
  idStage: z.string().min(1),
  noteAssiduite: z.number().min(1).max(5),
  noteCommunication: z.number().min(1).max(5),
  noteInitiative: z.number().min(1).max(5),
  noteProfessionnalisme: z.number().min(1).max(5),
  noteTravailEquipe: z.number().min(1).max(5),
  notePerformanceTechnique: z.number().min(1).max(5),
  commentaires: z.string().optional(),
});