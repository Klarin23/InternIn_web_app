import { z } from "zod";

export const createEntretienSchema = z.object({
  idCandidature: z.string().min(1, "Candidature invalide"),
  dateHeure: z.string().min(1, "La date et l'heure sont requises"),
  modeEntretien: z.enum(["video", "telephone", "presentiel"]),
  // Champ réutilisé selon le mode : lien vidéo, adresse ou numéro de
  // téléphone — pas de contrainte de format ici. Le contrôle strict
  // (URL http/https uniquement) se fait dans entretiens.service.js, qui
  // connaît le mode réellement en vigueur (voir validerLienVisio).
  lienGoogleMeet: z.string().max(500).optional(),
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
