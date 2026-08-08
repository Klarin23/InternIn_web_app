// Valide l'intégralité des données collectées sur les 4 étapes de
// l'onboarding entreprise, reçues en un seul payload à l'étape 5.

import { z } from "zod";

export const completeOnboardingEntrepriseSchema = z.object({
  // Étape 1
  nomEntreprise: z.string().min(1),
  secteurActivite: z.string().min(1),
  tailleEntreprise: z.enum(["1-10", "11-50", "51-200", "201-500", "500+"]),
  pays: z.string().min(1),
  ville: z.string().min(1),
  // Étape 2
  siteWeb: z.string().optional(),
  linkedinUrl: z.string().optional(),
  logoUrl: z.string().optional(),
  // Étape 3
  aPropos: z.string().min(20),
  mission: z.string().optional(),
  cultureEntreprise: z.string().optional(),
  // Étape 4
  contactNom: z.string().min(1),
  contactFonction: z.string().min(1),
  contactEmail: z.string().email(),
  contactTelephone: z.string().min(6),
  peutEtreSuperviseur: z.boolean().optional(),
});

export const updateProfileEntrepriseSchema = z.object({
  nomEntreprise: z.string().min(1).optional(),
  secteurActivite: z.string().optional(),
  tailleEntreprise: z
    .enum(["1-10", "11-50", "51-200", "201-500", "500+"])
    .optional(),
  pays: z.string().optional(),
  ville: z.string().optional(),
  adresse: z.string().optional(),
  siteWeb: z.string().optional(),
  linkedinUrl: z.string().optional(),
  aPropos: z.string().optional(),
  mission: z.string().optional(),
  cultureEntreprise: z.string().optional(),
});