import { z } from "zod";
import { checkExternalUrl, zUrlField } from "@/lib/utils/urlValidation";

const MAX_URL_LENGTH = 2048;

// Les règles côté client reprennent celles de l'API pour éviter qu'un
// formulaire accepte une valeur que le serveur rejettera ensuite.
const optionalUrl = zUrlField(checkExternalUrl, {
  allowedProtocols: ["https:"],
  maxLength: MAX_URL_LENGTH,
})(z.string().trim().max(MAX_URL_LENGTH).optional());

// Les logos proviennent normalement du service d'upload. HTTP est toléré
// uniquement pour les URL locales de développement, comme côté API.
const optionalLogoUrl = z
  .string()
  .trim()
  .max(MAX_URL_LENGTH, "L’URL du logo est trop longue")
  .optional()
  .superRefine((raw, ctx) => {
    const value = typeof raw === "string" ? raw.trim() : "";
    if (!value) return;

    let parsed;
    try {
      parsed = new URL(value);
    } catch {
      ctx.addIssue({ code: "custom", message: "URL du logo invalide" });
      return;
    }

    const isLocalHttp =
      parsed.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
    const result = checkExternalUrl(value, {
      allowedProtocols: isLocalHttp ? ["http:"] : ["https:"],
      maxLength: MAX_URL_LENGTH,
    });

    if (!result.ok) {
      const messages = {
        httpsRequired: "L’URL du logo doit utiliser HTTPS",
        tooLong: "L’URL du logo est trop longue",
        credentialsNotAllowed:
          "Les identifiants intégrés dans une URL ne sont pas autorisés",
        invalid: "URL du logo invalide",
      };
      ctx.addIssue({
        code: "custom",
        message: messages[result.code] || "URL du logo invalide",
      });
    }
  });

const nomUniversiteSchema = z
  .string()
  .trim()
  .min(1, "onboardingUniversite.validation.institutionNameRequired")
  .max(200, "Le nom de l’établissement est trop long");

const emailOfficielSchema = z
  .string()
  .trim()
  .min(1, "onboardingUniversite.validation.emailRequired")
  .max(254, "L’e-mail officiel est trop long")
  .email("onboardingUniversite.validation.emailInvalid");

const typeEtablissementSchema = z.enum(
  [
    "Université publique",
    "Université privée",
    "Grande École",
    "Institut Supérieur",
    "Centre de formation professionnelle",
    "Autre",
  ],
  { errorMap: () => ({ message: "onboardingUniversite.validation.typeRequired" }) },
);

const nombreEtudiantsSchema = z.preprocess(
  (value) => {
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed === "" ? undefined : trimmed;
    }
    return value;
  },
  z.union([
    z.undefined(),
    z.number().int().min(1).max(10_000_000),
    z.string()
      .regex(/^\d+$/, "Le nombre d’étudiants doit être un entier")
      .refine((value) => Number(value) >= 1, "Le nombre d’étudiants doit être supérieur à 0")
      .refine((value) => Number(value) <= 10_000_000, "Le nombre d’étudiants est trop élevé"),
  ]),
);

const optionalText = (maxLength) =>
  z.string().trim().max(maxLength).optional();

export const universiteStep1Schema = z.object({
  nomUniversite: nomUniversiteSchema,
  emailOfficiel: emailOfficielSchema,
  typeEtablissement: typeEtablissementSchema,
  pays: z.literal("Cameroun", {
    errorMap: () => ({ message: "onboardingUniversite.validation.countryInvalid" }),
  }),
  nombreEtudiants: nombreEtudiantsSchema,
});

export const universiteStep2Schema = z.object({
  siteWeb: optionalUrl,
  logoUrl: optionalLogoUrl,
});

export const universiteStep3Schema = z.object({
  contactServiceCarriere: optionalText(200),
  periodeStageHabituelle: optionalText(100),
  nomCoordinateurStage: optionalText(200),
});
