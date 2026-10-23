// Schémas de validation Zod pour l'authentification.

import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "auth.validation.passwordMin8")
  .regex(/[A-Z]/, "auth.validation.passwordUppercase")
  .regex(/[a-z]/, "auth.validation.passwordLowercase")
  .regex(/[0-9]/, "auth.validation.passwordNumber")
  .regex(
    /[^A-Za-z0-9]/,
    "auth.validation.passwordSpecial",
  );

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "auth.validation.emailRequired")
    .email("auth.validation.emailInvalid"),

  password: z.string().min(1, "auth.validation.passwordRequired"),

  remember: z.boolean().optional(),
});

export const signupSchema = z
  .object({
    email: z
      .string()
      .min(1, "auth.validation.emailRequired")
      .email("auth.validation.emailInvalid"),

    password: passwordSchema,

    confirmPassword: z.string().min(1, "auth.validation.confirmPasswordRequired"),

    acceptTerms: z.literal(true, {
      errorMap: () => ({
        message: "auth.validation.acceptTerms",
      }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "auth.validation.passwordsMismatch",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "auth.validation.emailRequired")
    .email("auth.validation.emailInvalid"),
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "auth.validation.confirmPasswordRequired"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "auth.validation.passwordsMismatch",
    path: ["confirmPassword"],
  });

export const accepterInvitationSchema = z
  .object({
    motDePasse: passwordSchema,

    confirmMotDePasse: z
      .string()
      .min(1, "auth.validation.confirmPasswordRequired"),
  })
  .refine((data) => data.motDePasse === data.confirmMotDePasse, {
    message: "auth.validation.passwordsMismatch",
    path: ["confirmMotDePasse"],
  });

export { passwordSchema };
