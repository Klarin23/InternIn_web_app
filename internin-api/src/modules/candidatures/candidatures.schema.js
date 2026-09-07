import { z } from "zod";

export const createCandidatureSchema = z.object({
  idOffre: z.string().min(1, "Offre invalide"),
  lettreMotivation: z.string().optional(),
});

export const updateStatutSchema = z.object({
  // "acceptee" est réservé au flux d'offre finale ; il ne peut pas être
  // forcé via l'endpoint générique PATCH /entreprise/:id/statut.
  statut: z.enum(["consultee", "preselectionnee", "rejetee"], {
    errorMap: () => ({ message: "Statut invalide" }),
  }),
});

export const evaluationSchema = z.object({
  noteGlobale: z.number().min(1).max(5).optional(),
  motivation: z.number().min(1).max(5).optional(),
  communication: z.number().min(1).max(5).optional(),
  technique: z.number().min(1).max(5).optional(),
  presentation: z.number().min(1).max(5).optional(),
});

export const noteSchema = z.object({
  contenu: z.string().min(1, "La note ne peut pas être vide").max(2000),
});

export const retirerCandidatureSchema = z
  .object({
    motifCode: z.enum(
      [
        "ACCEPTED_OTHER_OPPORTUNITY",
        "NO_LONGER_AVAILABLE",
        "OFFER_NO_LONGER_FITS",
        "FOUND_INTERNSHIP_ELSEWHERE",
        "AVAILABILITY_CHANGED",
        "PERSONAL_REASONS",
        "OTHER",
      ],
      { errorMap: () => ({ message: "Motif de retrait invalide" }) },
    ),
    commentaire: z
      .string()
      .max(500, "500 caractères maximum")
      .optional()
      .nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.motifCode === "OTHER") {
      const c = (data.commentaire || "").trim();
      if (!c) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Veuillez préciser le motif lorsque vous sélectionnez « Autre ».",
          path: ["commentaire"],
        });
      }
    }
  });
