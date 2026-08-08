// Schémas de validation Zod côté backend.
// Cette validation protège réellement l'API et la base de données.

import { z } from "zod";

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

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, "L'adresse e-mail est requise")
    .email("Adresse e-mail invalide"),

  password: passwordSchema,

  typeUtilisateur: z.enum(["stagiaire", "entreprise", "universite"], {
    errorMap: () => ({
      message: "Type de compte invalide",
    }),
  }),
});

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "L'adresse e-mail est requise")
    .email("Adresse e-mail invalide"),

  // IMPORTANT :
  // On ne vérifie PAS la politique de complexité lors de la connexion.
  // Un utilisateur doit pouvoir se connecter avec un ancien mot de passe
  // valide, même si celui-ci ne respecte pas la nouvelle politique.

  password: z.string().min(1, "Le mot de passe est requis"),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "L'adresse e-mail est requise")
    .email("Adresse e-mail invalide"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token manquant"),
  password: passwordSchema,
});

export { passwordSchema };
