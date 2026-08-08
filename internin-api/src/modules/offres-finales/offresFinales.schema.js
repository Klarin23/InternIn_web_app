import { z } from "zod";

export const createOffreFinaleSchema = z.object({
  idEntretien: z.string().min(1),
  intitulePoste: z.string().min(1, "L'intitulé du poste est requis"),
  objectifsApprentissage: z.string().optional(),
  volumeHoraireHebdo: z.number().min(15).max(40),
  dureeStage: z.enum(["1_mois", "2_mois", "3_mois"]),
  modeTravail: z.enum(["distance", "hybride", "presentiel"]),
  remunerationType: z.enum([
    "aucune",
    "indemnite_transport",
    "indemnite_repas",
    "allocation_mensuelle",
    "indemnite_internet_appel",
  ]),
  dateDebut: z.string().min(1, "La date de début est requise"),
});

export const validationSchema = z.object({
  statutValidationPlateforme: z.enum(["approuve", "rejete"]),
});

export const reponseSchema = z.object({
  statutReponseStagiaire: z.enum(["acceptee", "refusee"]),
});
