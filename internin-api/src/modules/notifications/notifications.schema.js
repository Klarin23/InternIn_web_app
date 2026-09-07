import { z } from "zod";
import { ENTREPRISE_NOTIF_CATEGORIES } from "./notifications.service.js";

/**
 * PATCH body : objet partiel ou complet.
 * Uniquement les clés de catégories connues, strictement booléennes.
 * .strict() rejette tout champ arbitraire (422).
 */
export const updateEntrepriseNotifPrefsSchema = z
  .object({
    messages: z.boolean().optional(),
    candidatures: z.boolean().optional(),
    evaluations: z.boolean().optional(),
    equipe: z.boolean().optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: "Au moins une préférence doit être fournie" },
  );

// Garde-fou : les clés du schéma = catégories du service
void ENTREPRISE_NOTIF_CATEGORIES;
