import { z } from "zod";

export const offreFormSchema = z
  .object({
    titre: z.string().min(1, "Le titre est requis"),
    /** Valeur sélectionnée dans la liste (peut être vide si custom renseigné). */
    departement: z.string().optional(),
    departementCustom: z.string().optional(),
    secteurActivite: z.string().optional(),
    secteurActiviteCustom: z.string().optional(),
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
  })
  .superRefine((data, ctx) => {
    const secteur = String(
      data.secteurActiviteCustom || data.secteurActivite || "",
    )
      .trim()
      .replace(/\s+/g, " ");
    const secteurFinal =
      secteur.toLowerCase() === "autre" ? "" : secteur;
    const customSecteur = String(data.secteurActiviteCustom || "").trim();
    const finalSecteur = customSecteur
      ? customSecteur.replace(/\s+/g, " ")
      : secteurFinal;

    if (!finalSecteur) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Le secteur d'activité est requis",
        path: ["secteurActivite"],
      });
    }

    const depSel = String(data.departement || "").trim();
    const depCustom = String(data.departementCustom || "").trim();
    const finalDep = depCustom
      ? depCustom.replace(/\s+/g, " ")
      : depSel.toLowerCase() === "autre"
        ? ""
        : depSel;

    if (!finalDep) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Le département est requis",
        path: ["departement"],
      });
    }
  });

// Regroupement des champs par étape du parcours de création, utilisé par
// OffreForm pour ne valider (et n'afficher les erreurs) que des champs de
// l'étape courante lors du clic sur "Continuer" — cf. RHF `trigger(names)`.
export const OFFRE_FORM_STEP_FIELDS = {
  1: [
    "titre",
    "secteurActivite",
    "secteurActiviteCustom",
    "departement",
    "departementCustom",
    "description",
  ],
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
