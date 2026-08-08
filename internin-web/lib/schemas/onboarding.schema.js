// Un schéma par étape de l'onboarding stagiaire. Seule l'étape 1 est utilisée
// pour l'instant — les autres sont posées à l'avance pour éviter les allers-retours
// quand on construira chaque étape suivante.

import { z } from "zod";

export const step1Schema = z.object({
  prenom: z.string().min(1, "Le prénom est requis"),
  nom: z.string().min(1, "Le nom est requis"),
  telephone: z.string().min(6, "Numéro de téléphone invalide"),
  pays: z.string().min(1, "Le pays est requis"),
  ville: z.string().min(1, "La ville est requise"),
  dateNaissance: z.string().optional(), // facultatif dans le schéma BDD
});

export const step2Schema = z.object({
  statutAcademique: z.enum(["etudiant", "jeune_diplome"], {
    errorMap: () => ({ message: "Merci de sélectionner votre statut" }),
  }),
  idUniversite: z.string().optional(), // NULL si non rattaché à une université partenaire
});

// Étapes 3 à 11 : seront complétées au fur et à mesure qu'on les construit.

export const formationSchema = z.object({
  typeFormation: z.enum(["en_cours", "obtenue"], {
    errorMap: () => ({ message: "Sélectionnez un statut" }),
  }),
  nomUniversite: z.string().min(1, "Le nom de l'établissement est requis"),
  faculte: z.string().optional(),
  departement: z.string().optional(),
  diplome: z.string().min(1, "Le diplôme est requis"),
  anneeEtude: z.string().optional(),
  anneeObtention: z.string().optional(),
});

export const step3Schema = z.object({
  formations: z.array(formationSchema).min(1, "Ajoutez au moins une formation"),
});

// Tous les champs sont facultatifs (cf. stagiaires.linkedin_url etc., NULL autorisé),
// mais s'ils sont renseignés, ils doivent être une URL valide.
const optionalUrl = z
  .string()
  .optional()
  .refine((val) => !val || /^https?:\/\/.+/.test(val), {
    message: "L'URL doit commencer par http:// ou https://",
  });

export const step5Schema = z.object({
  linkedinUrl: optionalUrl,
  githubUrl: optionalUrl,
  behanceUrl: optionalUrl,
  portfolioUrl: optionalUrl,
  siteWebUrl: optionalUrl,
});

export const step6Schema = z.object({
  competences: z
    .array(
      z.object({ idCompetence: z.string(), niveau: z.string().optional() }),
    )
    .min(1, "Sélectionnez au moins une compétence"),
});

export const step7Schema = z.object({
  centresInteret: z
    .array(z.string())
    .min(1, "Sélectionnez au moins un centre d'intérêt"),
});

export const step8Schema = z.object({
  objectifsDeveloppement: z
    .array(z.string())
    .min(1, "Sélectionnez au moins un objectif"),
});

export const step9Schema = z.object({
  joursDisponibles: z
    .array(z.string())
    .min(1, "Sélectionnez au moins un jour de disponibilité"),
  heureDebutDisponible: z.string().min(1, "Indiquez une heure de début"),
  heureFinDisponible: z.string().min(1, "Indiquez une heure de fin"),
});

export const step10Schema = z.object({
  dureeStageSouhaitee: z.enum(["1_mois", "2_mois", "3_mois"], {
    errorMap: () => ({ message: "Sélectionnez une durée" }),
  }),
  heuresHebdoSouhaitees: z
    .number()
    .min(15, "Minimum 15 heures par semaine")
    .max(40, "Maximum 40 heures par semaine"),
  dateDebutSouhaitee: z
    .string()
    .min(1, "La date de début souhaitée est requise"),
});