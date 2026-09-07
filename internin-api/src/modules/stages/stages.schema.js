import { z } from "zod";
import { parseStrictYmd } from "../../utils/dateValidation.js";

export const ajouterEntreeJournalSchema = z.object({
  titre: z.string().min(1, "Le titre est requis").max(200),
  description: z.string().min(1, "La description est requise"),
  dateActivite: z
    .string()
    .min(1, "La date de l'activité est requise")
    .refine((v) => parseStrictYmd(v) != null, {
      message: "Date d'activité invalide (AAAA-MM-JJ, date calendaire réelle)",
    }),
});

export const updateEntreeJournalSchema = z.object({
  titre: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  dateActivite: z
    .string()
    .min(1)
    .refine((v) => parseStrictYmd(v) != null, {
      message: "Date d'activité invalide (AAAA-MM-JJ)",
    })
    .optional(),
});

export const corrigerDatesStageSchema = z.object({
  dateDebut: z
    .string()
    .min(1, "La date de début est requise")
    .refine((v) => parseStrictYmd(v) != null, {
      message: "Date de début invalide. Utilisez une date calendaire réelle (AAAA-MM-JJ).",
    }),
});
