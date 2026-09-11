// Un schéma par étape de l'onboarding stagiaire. Seule l'étape 1 est utilisée
// pour l'instant — les autres sont posées à l'avance pour éviter les allers-retours
// quand on construira chaque étape suivante.

import { z } from "zod";

export const step1Schema = z.object({
  prenom: z.string().min(1, "auditUi.validation.firstNameRequired"),
  nom: z.string().min(1, "auditUi.validation.lastNameRequired"),
  telephone: z.string().min(6, "auditUi.validation.phoneInvalid"),
  pays: z.string().min(1, "auditUi.validation.countryRequired"),
  ville: z.string().min(1, "auditUi.validation.cityRequired"),
  dateNaissance: z.string().optional(), // facultatif dans le schéma BDD
});

export const step2Schema = z.object({
  statutAcademique: z.enum(["etudiant", "jeune_diplome"], {
    errorMap: () => ({ message: "auditUi.validation.statusRequired" }),
  }),
  idUniversite: z.string().optional(), // NULL si non rattaché à une université partenaire
});

// Étapes 3 à 11 : seront complétées au fur et à mesure qu'on les construit.

export const formationSchema = z.object({
  typeFormation: z.enum(["en_cours", "obtenue"], {
    errorMap: () => ({ message: "auditUi.validation.statusRequired" }),
  }),
  nomUniversite: z.string().min(1, "auditUi.validation.institutionRequired"),
  faculte: z.string().optional(),
  departement: z.string().optional(),
  diplome: z.string().min(1, "auditUi.validation.degreeRequired"),
  anneeEtude: z.string().optional(),
  anneeObtention: z.string().optional(),
});

export const step3Schema = z.object({
  formations: z
    .array(formationSchema)
    .min(1, "auditUi.validation.formationRequired"),
});

// Tous les champs sont facultatifs (cf. stagiaires.linkedin_url etc., NULL autorisé),
// mais s'ils sont renseignés, ils doivent être une URL valide.
import {
  checkExternalUrl,
  checkLinkedInUrl,
  checkGitHubUrl,
  zUrlField,
} from "@/lib/utils/urlValidation";

const optionalUrl = zUrlField(checkExternalUrl)(z.string().optional());
const optionalLinkedinUrl = zUrlField(checkLinkedInUrl)(z.string().optional());
const optionalGithubUrl = zUrlField(checkGitHubUrl)(z.string().optional());

export const step5Schema = z.object({
  linkedinUrl: optionalLinkedinUrl,
  githubUrl: optionalGithubUrl,
  behanceUrl: optionalUrl,
  portfolioUrl: optionalUrl,
  siteWebUrl: optionalUrl,
});

export const step6Schema = z.object({
  competences: z.array(
    z.object({
      idCompetence: z.string().optional(),
      nom: z.string().optional(),
      typeCompetence: z.string().optional(),
      niveau: z.string().optional(),
      isCustom: z.boolean().optional(),
    }),
  ),
  // tableau vide = aucune compétence → autorisé
});

export const step7Schema = z.object({
  centresInteret: z
    .array(z.string())
    .min(1, "auditUi.validation.interestRequired"),
});

export const step8Schema = z.object({
  objectifsDeveloppement: z
    .array(z.string())
    .min(1, "auditUi.validation.objectiveRequired"),
});

export const step9Schema = z.object({
  joursDisponibles: z
    .array(z.string())
    .min(1, "auditUi.validation.availabilityDayRequired"),
  heureDebutDisponible: z
    .string()
    .min(1, "auditUi.validation.startTimeRequired"),
  heureFinDisponible: z.string().min(1, "auditUi.validation.endTimeRequired"),
});

export const step10Schema = z.object({
  dureeStageSouhaitee: z.enum(["1_mois", "2_mois", "3_mois"], {
    errorMap: () => ({ message: "auditUi.validation.durationRequired" }),
  }),
  heuresHebdoSouhaitees: z
    .number()
    .min(15, "auditUi.validation.minimumHours")
    .max(40, "auditUi.validation.maximumHours"),
  dateDebutSouhaitee: z.string().min(1, "auditUi.validation.startDateRequired"),
});
