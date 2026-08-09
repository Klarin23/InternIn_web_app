import { z } from "zod";

export const createEntretienSchema = z
  .object({
    idCandidature: z.string().min(1, "Candidature invalide"),
    dateHeure: z.string().min(1, "La date et l'heure sont requises"),
    modeEntretien: z.enum(["video", "telephone", "presentiel"]),
    // Champ réutilisé selon le mode :
    // - video      → lien Meet / Zoom / Teams (obligatoire)
    // - presentiel → adresse / localisation (obligatoire)
    // - telephone  → numéro (optionnel)
    // Le contrôle détaillé est dans entretiens.service.js (validerLienVisio).
    lienGoogleMeet: z.string().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    const lien = (data.lienGoogleMeet || "").trim();
    if (data.modeEntretien === "video" && !lien) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lienGoogleMeet"],
        message:
          "Le lien de visioconférence (Google Meet, Zoom, Teams...) est obligatoire",
      });
    }
    if (data.modeEntretien === "presentiel" && lien.length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lienGoogleMeet"],
        message:
          "L'adresse ou la localisation de l'entretien en présentiel est obligatoire",
      });
    }
  });

export const updateEntretienEntrepriseSchema = z.object({
  dateHeure: z.string().optional(),
  modeEntretien: z.enum(["video", "telephone", "presentiel"]).optional(),
  lienGoogleMeet: z.string().max(500).optional(),
  statut: z.enum(["planifie", "termine", "annule", "absent"]).optional(),
});

export const annulerEntretienSchema = z.object({
  raisonAnnulation: z
    .string()
    .min(1, "La raison de l'annulation est obligatoire"),
});

export const demanderReprogrammationSchema = z.object({
  dateHeureProposee: z.string().min(1, "Proposez une nouvelle date et heure"),
  retourEntretien: z
    .string()
    .min(1, "Merci de préciser la raison de votre demande"),
});

export const notesPreparationSchema = z.object({
  notesPreparation: z.string().max(2000).optional().default(""),
});
