import { z } from "zod";

export const completeOnboardingUniversiteSchema = z.object({
  nomUniversite: z.string().min(1),
  emailOfficiel: z.string().email(),
  typeEtablissement: z.string().min(1),
  pays: z.string().min(1),
  nombreEtudiants: z.string().optional(),
  siteWeb: z.string().optional(),
  logoUrl: z.string().optional(),
  contactServiceCarriere: z.string().optional(),
  periodeStageHabituelle: z.string().optional(),
  heuresRecommandeesSemaine: z.string().optional(),
  nomCoordinateurStage: z.string().optional(),
});

// Page "Paramètres" de l'espace université : seuls les champs opérationnels
// sont modifiables ici. L'identité de l'établissement (nom, e-mail officiel,
// pays, type) reste figée après la vérification par un administrateur — la
// modifier librement permettrait de changer d'identité après coup sans
// nouveau contrôle. Ces champs-là restent affichés en lecture seule côté
// front, avec une invitation à contacter le support pour les corriger.
export const updateProfilUniversiteSchema = z.object({
  siteWeb: z.string().optional(),
  logoUrl: z.string().optional(),
  nombreEtudiants: z.string().optional(),
  contactServiceCarriere: z.string().optional(),
  periodeStageHabituelle: z.string().optional(),
  heuresRecommandeesSemaine: z.string().optional(),
  nomCoordinateurStage: z.string().optional(),
});

export const validerConventionSchema = z.object({
  valider: z.boolean(),
});