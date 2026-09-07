import { z } from "zod";
import { parseStrictYmd } from "../../utils/dateValidation.js";
import { OBJECTIFS_LIMITS } from "../../utils/objectifsPedagogiques.js";

const objectifItemSchema = z
  .string()
  .trim()
  .min(
    OBJECTIFS_LIMITS.minLength,
    `Chaque objectif doit contenir au moins ${OBJECTIFS_LIMITS.minLength} caractères`,
  )
  .max(
    OBJECTIFS_LIMITS.maxLength,
    `Chaque objectif ne peut pas dépasser ${OBJECTIFS_LIMITS.maxLength} caractères`,
  );

export const createOffreFinaleSchema = z
  .object({
    idEntretien: z.string().min(1),
    intitulePoste: z.string().min(1, "L'intitulé du poste est requis"),
    // Liste structurée (préférée)
    objectifs: z.array(objectifItemSchema).optional(),
    // Compat : ancien champ texte libre
    objectifsApprentissage: z.string().optional(),
    volumeHoraireHebdo: z.coerce.number().min(15).max(40),
    dureeStage: z.enum(["1_mois", "2_mois", "3_mois"]),
    modeTravail: z.enum(["distance", "hybride", "presentiel"]),
    remunerationType: z.enum([
      "aucune",
      "indemnite_transport",
      "indemnite_repas",
      "allocation_mensuelle",
      "indemnite_internet_appel",
    ]),
    dateDebut: z
      .string()
      .min(1, "La date de début est requise")
      .refine((v) => parseStrictYmd(v) != null, {
        message:
          "Date de début invalide. Utilisez une date calendaire réelle (AAAA-MM-JJ).",
      }),
  })
  .superRefine((data, ctx) => {
    const fromArray = Array.isArray(data.objectifs)
      ? data.objectifs.map((s) => String(s).trim()).filter(Boolean)
      : [];
    const fromText = data.objectifsApprentissage
      ? String(data.objectifsApprentissage)
          .split(/\r?\n+/)
          .map((l) => l.replace(/^\d+[\.\)\-]\s*/, "").trim())
          .filter(Boolean)
      : [];
    const list = fromArray.length ? fromArray : fromText;

    if (list.length < OBJECTIFS_LIMITS.minCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Veuillez définir au moins un objectif pédagogique avant de continuer.",
        path: ["objectifs"],
      });
    }
    if (list.length > OBJECTIFS_LIMITS.maxCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Maximum ${OBJECTIFS_LIMITS.maxCount} objectifs pédagogiques.`,
        path: ["objectifs"],
      });
    }
  });

export const validationSchema = z.object({
  statutValidationPlateforme: z.enum(["approuve", "rejete"]),
});

export const reponseSchema = z
  .object({
    statutReponseStagiaire: z.enum(["acceptee", "refusee"]),
    motifRefusStagiaire: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.statutReponseStagiaire === "refusee") {
      const motif = String(data.motifRefusStagiaire ?? "")
        .trim()
        .replace(/\s+/g, " ");
      if (motif.length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Le motif du refus est obligatoire (10 caractères minimum).",
          path: ["motifRefusStagiaire"],
        });
      } else if (motif.length > 1000) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Le motif du refus ne peut pas dépasser 1000 caractères.",
          path: ["motifRefusStagiaire"],
        });
      }
    }
  });
