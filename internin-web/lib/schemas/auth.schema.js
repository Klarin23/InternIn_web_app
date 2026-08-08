// Schémas de validation Zod pour l'authentification.

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

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "L'adresse e-mail est requise")
    .email("Adresse e-mail invalide"),

  password: z.string().min(1, "Le mot de passe est requis"),

  remember: z.boolean().optional(),
});

export const signupSchema = z
  .object({
    email: z
      .string()
      .min(1, "L'adresse e-mail est requise")
      .email("Adresse e-mail invalide"),

    password: passwordSchema,

    confirmPassword: z.string().min(1, "Merci de confirmer votre mot de passe"),

    acceptTerms: z.literal(true, {
      errorMap: () => ({
        message: "Vous devez accepter les conditions pour continuer",
      }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "L'adresse e-mail est requise")
    .email("Adresse e-mail invalide"),
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Merci de confirmer votre mot de passe"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export const accepterInvitationSchema = z
  .object({
    motDePasse: passwordSchema,

    confirmMotDePasse: z
      .string()
      .min(1, "Merci de confirmer votre mot de passe"),
  })
  .refine((data) => data.motDePasse === data.confirmMotDePasse, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmMotDePasse"],
  });

export { passwordSchema };
