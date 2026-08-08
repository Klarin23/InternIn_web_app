import { z } from "zod";

export const ajouterEntreeJournalSchema = z.object({
  titre: z.string().min(1, "Le titre est requis").max(200),
  description: z.string().min(1, "La description est requise"),
  dateActivite: z.string().min(1, "La date de l'activité est requise"),
});

export const updateEntreeJournalSchema = z.object({
  titre: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  dateActivite: z.string().min(1).optional(),
});
