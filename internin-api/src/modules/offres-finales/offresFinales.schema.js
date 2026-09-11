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

const jourSemaineSchema = z.enum([
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
  "dimanche",
]);
const heureSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Heure invalide");
const horaireStageSchema = z.object({
  jourSemaine: jourSemaineSchema,
  heureDebut: heureSchema,
  heureFin: heureSchema,
});

const meetingUrlSchema = z
  .string()
  .trim()
  .max(2048, "Le lien de réunion est trop long.")
  .url("Le lien de réunion doit être une URL valide.")
  .refine((value) => {
    try {
      const url = new URL(value);
      if (url.protocol !== "https:") return false;
      const host = url.hostname.toLowerCase();
      return [
        "meet.google.com",
        "zoom.us",
        "teams.microsoft.com",
        "teams.live.com",
        "webex.com",
        "skype.com",
      ].some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
    } catch {
      return false;
    }
  }, "Utilisez un lien HTTPS Google Meet, Zoom, Teams, Webex ou Skype.");

export const createOffreFinaleSchema = z
  .object({
    idEntretien: z.string().min(1),
    // L'intitulé du poste est volontairement absent du payload : il est
    // toujours récupéré côté serveur depuis l'offre de stage liée à la
    // candidature / à l'entretien.
    // Liste structurée (préférée)
    objectifs: z.array(objectifItemSchema).optional(),
    // Compat : ancien champ texte libre
    objectifsApprentissage: z.string().optional(),
    volumeHoraireHebdo: z.coerce.number().int().min(15).max(40),
    dureeStage: z.enum(["1_mois", "2_mois", "3_mois"]),
    modeTravail: z.enum(["distance", "hybride", "presentiel"]),
    lienReunionOnline: meetingUrlSchema.optional().nullable(),
    horairesStage: z.array(horaireStageSchema).min(1).max(7),
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

    const jours = new Set();
    let totalMinutes = 0;
    for (const [index, horaire] of data.horairesStage.entries()) {
      if (jours.has(horaire.jourSemaine)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Un jour ne peut apparaître qu'une seule fois.",
          path: ["horairesStage", index, "jourSemaine"],
        });
      }
      jours.add(horaire.jourSemaine);
      const [debutH, debutM] = horaire.heureDebut.split(":").map(Number);
      const [finH, finM] = horaire.heureFin.split(":").map(Number);
      const debut = debutH * 60 + debutM;
      const fin = finH * 60 + finM;
      if (fin <= debut) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "L'heure de fin doit être postérieure à l'heure de début.",
          path: ["horairesStage", index, "heureFin"],
        });
      } else {
        totalMinutes += fin - debut;
      }
    }
    if (totalMinutes !== data.volumeHoraireHebdo * 60) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Les créneaux doivent correspondre exactement au volume hebdomadaire.",
        path: ["horairesStage"],
      });
    }
    if (data.modeTravail === "distance" && !data.lienReunionOnline) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Un lien de réunion est obligatoire pour un stage à distance.",
        path: ["lienReunionOnline"],
      });
    }
    if (data.modeTravail !== "distance" && data.lienReunionOnline) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Le lien de réunion est réservé au mode à distance.",
        path: ["lienReunionOnline"],
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
          message: "Le motif du refus est obligatoire (10 caractères minimum).",
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
