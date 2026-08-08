import { z } from "zod";

export const envoyerInvitationSchema = z.object({
  idEntreprise: z.string().uuid("Entreprise invalide"),
  message: z.string().max(1000).optional(),
});

export const repondreInvitationSchema = z.object({
  accepter: z.boolean(),
});
