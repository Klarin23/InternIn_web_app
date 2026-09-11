// Schémas de validation pour l'onboarding entreprise — un fichier séparé de
// celui du stagiaire pour garder chaque parcours indépendant et lisible.

import { z } from "zod";
import {
  checkExternalUrl,
  checkLinkedInUrl,
  zUrlField,
} from "@/lib/utils/urlValidation";

export const entrepriseStep1Schema = z.object({
  nomEntreprise: z.string().min(1, "auditUi.onboarding.entrepriseOnboarding.step1.errors.companyName"),
  secteurActivite: z
    .string()
    .trim()
    .min(1, "auditUi.onboarding.entrepriseOnboarding.step1.errors.sector")
    .max(150, "auditUi.onboarding.entrepriseOnboarding.step1.errors.sectorTooLong"),
  tailleEntreprise: z.enum(["1-10", "11-50", "51-200", "201-500", "500+"], {
    errorMap: () => ({ message: "auditUi.onboarding.entrepriseOnboarding.step1.errors.companySize" }),
  }),
  pays: z.string().min(1, "auditUi.onboarding.entrepriseOnboarding.step1.errors.country"),
  ville: z.string().min(1, "auditUi.onboarding.entrepriseOnboarding.step1.errors.city"),
});

const optionalUrl = zUrlField(checkExternalUrl)(z.string().optional());
const optionalLinkedinUrl = zUrlField(checkLinkedInUrl)(z.string().optional());

export const entrepriseStep2Schema = z.object({
  siteWeb: optionalUrl,
  linkedinUrl: optionalLinkedinUrl,
  logoUrl: z.string().optional(), // rempli automatiquement après upload, pas saisi à la main
});

export const entrepriseStep3Schema = z.object({
  aPropos: z
    .string()
    .min(
      20,
      "onboardingEntreprise.step3.aboutTooShort",
    ),
  mission: z.string().optional(),
  cultureEntreprise: z.string().optional(),
});

export const entrepriseStep4Schema = z.object({
  contactNom: z.string().min(1, "auditUi.onboarding.entrepriseOnboarding.step4.errors.nameRequired"),
  contactFonction: z.string().min(1, "auditUi.onboarding.entrepriseOnboarding.step4.errors.functionRequired"),
  contactEmail: z
    .string()
    .min(1, "auditUi.onboarding.entrepriseOnboarding.step4.errors.emailRequired")
    .email("auditUi.onboarding.entrepriseOnboarding.step4.errors.emailInvalid"),
  contactTelephone: z.string().min(6, "auditUi.onboarding.entrepriseOnboarding.step4.errors.phoneInvalid"),
  peutEtreSuperviseur: z.boolean().optional(),
});