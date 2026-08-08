import { z } from "zod";

// Réutilise exactement les mêmes règles de notation que le module
// evaluations/ existant (evaluations.schema.js) : notes de 1 à 5, commentaire
// libre optionnel. Seule différence : ici, idStage arrive dans l'URL (donc
// pas dans le body), et on ajoute `statutCible` pour distinguer un
// enregistrement en brouillon d'une soumission définitive.
export const enregistrerEvaluationSchema = z.object({
  numeroSemaine: z.number().int().min(1).max(104).optional(),
  noteAssiduite: z.number().int().min(1).max(5),
  noteCommunication: z.number().int().min(1).max(5),
  noteInitiative: z.number().int().min(1).max(5),
  noteProfessionnalisme: z.number().int().min(1).max(5),
  noteTravailEquipe: z.number().int().min(1).max(5),
  notePerformanceTechnique: z.number().int().min(1).max(5),
  commentaires: z.string().max(4000).optional(),
  statutCible: z.enum(["brouillon", "soumise"]),
});
