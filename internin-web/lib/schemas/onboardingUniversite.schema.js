import { z } from "zod";
import { checkExternalUrl, zUrlField } from "@/lib/utils/urlValidation";

const optionalUrl = zUrlField(checkExternalUrl)(z.string().optional());

export const universiteStep1Schema = z.object({
  nomUniversite: z.string().min(1, "onboardingUniversite.validation.institutionNameRequired"),
  emailOfficiel: z
    .string()
    .min(1, "onboardingUniversite.validation.emailRequired")
    .email("onboardingUniversite.validation.emailInvalid"),
  typeEtablissement: z.string().min(1, "onboardingUniversite.validation.typeRequired"),
  pays: z.literal("Cameroun", { errorMap: () => ({ message: "onboardingUniversite.validation.countryInvalid" }) }),
  nombreEtudiants: z.string().optional(),
});

export const universiteStep2Schema = z.object({
  siteWeb: optionalUrl,
  logoUrl: z.string().optional(),
});

export const universiteStep3Schema = z.object({
  contactServiceCarriere: z.string().optional(),
  periodeStageHabituelle: z.string().optional(),
  nomCoordinateurStage: z.string().optional(),
});
