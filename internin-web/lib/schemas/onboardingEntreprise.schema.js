// Schémas de validation pour l'onboarding entreprise — un fichier séparé de
// celui du stagiaire pour garder chaque parcours indépendant et lisible.

import { z } from "zod";

export const entrepriseStep1Schema = z.object({
  nomEntreprise: z.string().min(1, "Le nom de l'entreprise est requis"),
  secteurActivite: z.string().min(1, "Le secteur d'activité est requis"),
  tailleEntreprise: z.enum(["1-10", "11-50", "51-200", "201-500", "500+"], {
    errorMap: () => ({ message: "Sélectionnez une taille d'entreprise" }),
  }),
  pays: z.string().min(1, "Le pays est requis"),
  ville: z.string().min(1, "La ville est requise"),
});

const optionalUrl = z
  .string()
  .optional()
  .refine((val) => !val || /^https?:\/\/.+/.test(val), {
    message: "L'URL doit commencer par http:// ou https://",
  });

export const entrepriseStep2Schema = z.object({
  siteWeb: optionalUrl,
  linkedinUrl: optionalUrl,
  logoUrl: z.string().optional(), // rempli automatiquement après upload, pas saisi à la main
});

export const entrepriseStep3Schema = z.object({
  aPropos: z
    .string()
    .min(
      20,
      "Décrivez votre entreprise en quelques phrases (20 caractères minimum)",
    ),
  mission: z.string().optional(),
  cultureEntreprise: z.string().optional(),
});

export const entrepriseStep4Schema = z.object({
  contactNom: z.string().min(1, "Le nom du contact est requis"),
  contactFonction: z.string().min(1, "La fonction est requise"),
  contactEmail: z
    .string()
    .min(1, "L'e-mail est requis")
    .email("Adresse e-mail invalide"),
  contactTelephone: z.string().min(6, "Numéro de téléphone invalide"),
  peutEtreSuperviseur: z.boolean().optional(),
});