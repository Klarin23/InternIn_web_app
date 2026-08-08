import { z } from "zod";

export const createOffreSchema = z.object({
  titre: z.string().min(1, "Le titre est requis"),
  departement: z.string().optional(),
  secteurActivite: z.string().min(1, "Le secteur d'activité est requis"),
  description: z
    .string()
    .min(20, "Décrivez le stage en quelques phrases (20 caractères minimum)"),
  responsabilites: z.string().optional(),
  competencesRequises: z.string().optional(),
  opportunitesApprentissage: z.string().optional(),
  modeTravail: z.enum(["distance", "hybride", "presentiel"], {
    errorMap: () => ({ message: "Sélectionnez un mode de travail" }),
  }),
  remunerationType: z.enum(
    [
      "aucune",
      "indemnite_transport",
      "indemnite_repas",
      "allocation_mensuelle",
      "indemnite_internet_appel",
    ],
    {
      errorMap: () => ({ message: "Sélectionnez un type de rémunération" }),
    },
  ),
  montantRemuneration: z.string().nullable().optional(),
  dureeStage: z.enum(["1_mois", "2_mois", "3_mois"]).optional(),
  dateLimiteCandidature: z.string().nullable().optional(),
  nombrePostes: z.number().min(1, "Au moins 1 poste").default(1),
  statut: z.enum(["brouillon", "publie"]).default("brouillon"),
});

export const updateOffreSchema = z.object({
  titre: z.string().min(1).optional(),
  departement: z.string().optional(),
  secteurActivite: z.string().min(1).optional(),
  description: z.string().min(20).optional(),
  responsabilites: z.string().optional(),
  competencesRequises: z.string().optional(),
  opportunitesApprentissage: z.string().optional(),
  modeTravail: z.enum(["distance", "hybride", "presentiel"]).optional(),
  remunerationType: z
    .enum([
      "aucune",
      "indemnite_transport",
      "indemnite_repas",
      "allocation_mensuelle",
      "indemnite_internet_appel",
    ])
    .optional(),
  montantRemuneration: z.string().nullable().optional(),
  dureeStage: z.enum(["1_mois", "2_mois", "3_mois"]).optional(),
  dateLimiteCandidature: z.string().nullable().optional(),
  nombrePostes: z.number().min(1).optional(),
  statut: z
    .enum(["brouillon", "publie", "pause", "ferme", "archive"])
    .optional(),
});