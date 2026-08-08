import { z } from "zod";

export const createRecommandationSchema = z.object({
  contenu: z
    .string()
    .min(20, "La recommandation doit faire au moins 20 caractères"),
});

export const toggleVisibiliteSchema = z.object({
  visibleLinkedin: z.boolean(),
});
