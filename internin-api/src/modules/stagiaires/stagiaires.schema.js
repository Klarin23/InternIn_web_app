// Valide l'intégralité des données collectées sur les 10 étapes de
// l'onboarding, reçues en un seul payload à l'étape 11.

import { z } from "zod";

const formationSchema = z.object({
  typeFormation: z.enum(["en_cours", "obtenue"]),
  nomUniversite: z.string().min(1),
  faculte: z.string().optional(),
  departement: z.string().optional(),
  diplome: z.string().min(1),
  anneeEtude: z.string().optional(),
  anneeObtention: z.string().optional(),
});

export const completeOnboardingSchema = z.object({
  // Étape 1
  prenom: z.string().min(1),
  nom: z.string().min(1),
  telephone: z.string().min(6),
  pays: z.string().min(1),
  ville: z.string().min(1),
  dateNaissance: z.string().optional(),
  // Étape 2
  statutAcademique: z.enum(["etudiant", "jeune_diplome"]),
  idUniversite: z.string().optional(),
  // Étape 3
  formations: z.array(formationSchema).min(1),
  // Étape 4
  cvUrl: z.string().min(1, "Le CV est requis"),
  // Étape 5
  linkedinUrl: z.string().optional(),
  githubUrl: z.string().optional(),
  behanceUrl: z.string().optional(),
  portfolioUrl: z.string().optional(),
  siteWebUrl: z.string().optional(),
  // Étape 6
  competences: z
    .array(
      z.object({ idCompetence: z.string(), niveau: z.string().optional() }),
    )
    .min(1),
  // Étape 7
  centresInteret: z.array(z.string()).min(1),
  // Étape 8
  objectifsDeveloppement: z.array(z.string()).min(1),
  // Étape 9
  joursDisponibles: z.array(z.string()).min(1),
  heureDebutDisponible: z.string().min(1),
  heureFinDisponible: z.string().min(1),
  // Étape 10
  dureeStageSouhaitee: z.enum(["1_mois", "2_mois", "3_mois"]),
  heuresHebdoSouhaitees: z.number().min(15).max(40),
  dateDebutSouhaitee: z.string().min(1),
});

// Schéma de mise à jour du profil depuis la page "Mon profil" — tous les
// champs sont optionnels (mise à jour partielle, section par section).
export const updateProfileSchema = z.object({
  // 1. Informations personnelles
  prenom: z.string().min(1).optional(),
  nom: z.string().min(1).optional(),
  telephone: z.string().min(6).optional(),
  ville: z.string().min(1).optional(),
  pays: z.string().min(1).optional(),

  // 3. Profil professionnel
  titreProfessionnel: z.string().max(150).optional(),
  presentation: z.string().optional(),
  objectifProfessionnel: z.string().optional(),
  dureeStageSouhaitee: z.enum(["1_mois", "2_mois", "3_mois"]).optional(),
  dateDebutSouhaitee: z.string().optional(),

  // 5. CV
  cvUrl: z.string().min(1).optional(),

  // 6. Liens professionnels
  linkedinUrl: z.string().optional(),
  githubUrl: z.string().optional(),
  behanceUrl: z.string().optional(),
  portfolioUrl: z.string().optional(),
  siteWebUrl: z.string().optional(),

  // 8. Préférences de recherche
  secteursRecherches: z.array(z.string()).optional(),
  villesRecherchees: z.array(z.string()).optional(),
  modalitesTravailSouhaitees: z
    .array(z.enum(["presentiel", "hybride", "distance"]))
    .optional(),
  remunerationSouhaitee: z
    .enum([
      "aucune",
      "indemnite_transport",
      "indemnite_repas",
      "allocation_mensuelle",
      "indemnite_internet_appel",
    ])
    .optional(),

  // 4. Compétences — remplace entièrement la liste existante si fournie
  competences: z
    .array(
      z.object({ idCompetence: z.string(), niveau: z.string().optional() }),
    )
    .optional(),

  // 7. Centres d'intérêt — remplace entièrement la liste existante si fournie
  centresInteret: z.array(z.string()).optional(),

  // 2. Disponibilité (bonus, section "Disponibilité")
  joursDisponibles: z.array(z.string()).optional(),
  heureDebutDisponible: z.string().optional(),
  heureFinDisponible: z.string().optional(),
});