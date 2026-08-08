import { z } from "zod";

const optionalUrl = z
  .string()
  .optional()
  .refine((val) => !val || /^https?:\/\/.+/.test(val), {
    message: "L'URL doit commencer par http:// ou https://",
  });

export const universiteStep1Schema = z.object({
  nomUniversite: z.string().min(1, "Le nom de l'établissement est requis"),
  emailOfficiel: z
    .string()
    .min(1, "L'e-mail officiel est requis")
    .email("Adresse e-mail invalide"),
  typeEtablissement: z.string().min(1, "Sélectionnez un type d'établissement"),
  pays: z.string().min(1, "Le pays est requis"),
  nombreEtudiants: z.string().optional(),
});

export const universiteStep2Schema = z.object({
  siteWeb: optionalUrl,
  logoUrl: z.string().optional(),
});

export const universiteStep3Schema = z.object({
  contactServiceCarriere: z.string().optional(),
  periodeStageHabituelle: z.string().optional(),
  heuresRecommandeesSemaine: z.string().optional(),
  nomCoordinateurStage: z.string().optional(),
});
