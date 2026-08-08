import { z } from "zod";
import { CLES_PERMISSIONS } from "./equipe.constants.js";

const passwordSchema = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères")
  .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
  .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
  .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre")
  .regex(
    /[^A-Za-z0-9]/,
    "Le mot de passe doit contenir au moins un caractère spécial",
  );

const roleEquipeInvitable = z.enum(
  ["gestionnaire_recrutement", "superviseur", "lecture_seule"],
  {
    errorMap: () => ({
      message: "Sélectionnez un rôle",
    }),
  },
);

export const inviterMembreSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),

  email: z.string().email("Adresse email invalide"),

  roleEquipe: roleEquipeInvitable,

  permissionsPersonnalisees: z.array(z.enum(CLES_PERMISSIONS)).optional(),
});

export const updateMembreSchema = z.object({
  roleEquipe: roleEquipeInvitable.optional(),

  permissionsPersonnalisees: z
    .array(z.enum(CLES_PERMISSIONS))
    .nullable()
    .optional(),
});

export const updateStatutMembreSchema = z.object({
  statutMembre: z.enum(["actif", "desactive"], {
    errorMap: () => ({
      message: "Statut invalide",
    }),
  }),
});

export const affecterSuperviseurSchema = z.object({
  idStage: z.string().uuid("Stage invalide"),

  idMembre: z.string().uuid("Membre invalide"),
});

export const updateParametresEquipeSchema = z.object({
  roleParDefautInvitation: roleEquipeInvitable.optional(),

  expirationInvitationJours: z.number().min(1).max(90).optional(),

  approbationRequisePourInvitation: z.boolean().optional(),

  notifierAdminNouvelleActivite: z.boolean().optional(),
});

export const accepterInvitationSchema = z.object({
  motDePasse: passwordSchema,
});
