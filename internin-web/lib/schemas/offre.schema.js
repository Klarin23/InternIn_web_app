import { z } from "zod";

export const offreFormSchema = z.object({
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
      "indemnite_internet_appel",
      "allocation_mensuelle",
    ],
    {
      errorMap: () => ({ message: "Sélectionnez un type de rémunération" }),
    },
  ),
  montantRemuneration: z.string().optional(),
  nombrePostes: z.number().min(1, "Au moins 1 poste"),
  dureeStage: z.enum(["1_mois", "2_mois", "3_mois"]).optional(),
  dateLimiteCandidature: z.string().optional(),
});

// Regroupement des champs par étape du parcours de création, utilisé par
// OffreForm pour ne valider (et n'afficher les erreurs) que des champs de
// l'étape courante lors du clic sur "Continuer" — cf. RHF `trigger(names)`.
export const OFFRE_FORM_STEP_FIELDS = {
  1: ["titre", "secteurActivite", "departement", "description"],
  2: ["responsabilites", "competencesRequises", "opportunitesApprentissage"],
  3: [
    "modeTravail",
    "dureeStage",
    "nombrePostes",
    "remunerationType",
    "montantRemuneration",
    "dateLimiteCandidature",
  ],
};
