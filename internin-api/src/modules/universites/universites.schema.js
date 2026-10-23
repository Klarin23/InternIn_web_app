import { z } from "zod";

// Champ optionnel côté formulaire : une chaîne vide signifie « non renseigné ».
// Lorsqu'une valeur est fournie, elle doit représenter un nombre entier positif
// et rester dans une borne réaliste compatible avec la colonne INTEGER PostgreSQL.
const nombreEtudiantsSchema = z.preprocess(
  (value) => {
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed === "" ? undefined : trimmed;
    }
    return value;
  },
  z.coerce
    .number()
    .int("Le nombre d’étudiants doit être un entier")
    .min(1, "Le nombre d’étudiants doit être supérieur à 0")
    .max(10_000_000, "Le nombre d’étudiants est trop élevé")
    .optional(),
);

export const completeOnboardingUniversiteSchema = z.object({
  nomUniversite: z.string().min(1),
  emailOfficiel: z.string().email(),
  typeEtablissement: z.string().min(1),
  pays: z.string().min(1),
  nombreEtudiants: nombreEtudiantsSchema,
  siteWeb: z.string().optional(),
  logoUrl: z.string().optional(),
  contactServiceCarriere: z.string().optional(),
  periodeStageHabituelle: z.string().optional(),
  nomCoordinateurStage: z.string().optional(),
});

// Page "Paramètres" de l'espace université : seuls les champs opérationnels
// sont modifiables ici. L'identité de l'établissement (nom, e-mail officiel,
// pays, type) reste figée après la vérification par un administrateur — la
// modifier librement permettrait de changer d'identité après coup sans
// nouveau contrôle. Ces champs-là restent affichés en lecture seule côté
// front, avec une invitation à contacter le support pour les corriger.
export const updateProfilUniversiteSchema = z.object({
  siteWeb: z.string().optional(),
  logoUrl: z.string().optional(),
  nombreEtudiants: nombreEtudiantsSchema,
  contactServiceCarriere: z.string().optional(),
  periodeStageHabituelle: z.string().optional(),
  nomCoordinateurStage: z.string().optional(),
});

export const validerConventionSchema = z.object({
  valider: z.boolean(),
});

// Query params de la liste des étudiants de l'espace Université.
// Les bornes sont validées à l'entrée de l'API pour éviter des LIMIT/OFFSET
// invalides ou démesurés. Le service conserve également une borne défensive.
export const listEtudiantsQuerySchema = z.object({
  recherche: z.string().trim().max(100).optional(),
  statut: z.enum(["en_stage", "sans_stage", "diplome"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  parPage: z.coerce.number().int().min(1).max(100).default(20),
});


// Query params des entreprises partenaires.
export const listEntreprisesQuerySchema = z.object({
  recherche: z.string().trim().max(100).optional(),
});

// Query params des conventions de l'université. Les statuts correspondent
// strictement aux statuts calculés et exposés par listConventions().
export const listConventionsQuerySchema = z.object({
  recherche: z.string().trim().max(100).optional(),
  statut: z
    .enum(["en_attente", "active", "terminee", "interrompue"])
    .optional(),
});

// Query params de la liste des maîtres de stage. Les limites sont alignées
// avec normaliserPaginationMaitres() dans le service (50 éléments maximum).
export const listMaitresDeStageQuerySchema = z.object({
  recherche: z.string().trim().max(100).optional(),
  entreprise: z.string().uuid("Identifiant entreprise invalide").optional(),
  statut: z.enum(["invite", "actif", "desactive"]).optional(),
  encadrement: z.enum(["actuel", "aucun"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  parPage: z.coerce.number().int().min(1).max(50).default(20),
  tri: z.enum(["nom", "entreprise", "stagiaires", "stages"]).default("nom"),
  ordre: z.enum(["asc", "desc"]).default("asc"),
});
