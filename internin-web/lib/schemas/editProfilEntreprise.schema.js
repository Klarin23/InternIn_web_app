// Schéma de validation pour le formulaire "Modifier le profil" (espace
// Entreprise). Reprend volontairement les mêmes règles que
// `updateProfileEntrepriseSchema` côté API (internin-api/src/modules/
// entreprises/entreprises.schema.js) : tous les champs sont optionnels côté
// backend, donc on ne bloque jamais la sauvegarde d'un profil partiel — on
// ajoute seulement une validation de format (URL, etc.) pour guider la
// saisie, dans le même esprit que entrepriseStep2Schema utilisé lors de
// l'onboarding.

import { z } from "zod";
import {
  checkExternalUrl,
  checkLinkedInUrl,
  zUrlField,
} from "@/lib/utils/urlValidation";

const optionalUrl = zUrlField(checkExternalUrl)(z.string().optional());
const optionalLinkedinUrl = zUrlField(checkLinkedInUrl)(z.string().optional());

export const TAILLES_ENTREPRISE = ["1-10", "11-50", "51-200", "201-500", "500+"];

export const editProfilEntrepriseSchema = z.object({
  nomEntreprise: z.string().min(1, "profilEntreprise.validation.companyNameRequired"),
  secteurActivite: z.string().optional(),
  tailleEntreprise: z.enum(TAILLES_ENTREPRISE).optional().or(z.literal("")),
  pays: z.string().optional(),
  ville: z.string().optional(),
  adresse: z.string().optional(),
  siteWeb: optionalUrl,
  linkedinUrl: optionalLinkedinUrl,
  aPropos: z.string().optional(),
  mission: z.string().optional(),
  cultureEntreprise: z.string().optional(),
});
