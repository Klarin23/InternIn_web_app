import { Router } from "express";

import {
  register,
  login,
  me,
  verifyEmailController,
  resendEmailVerificationController,
  forgotPasswordController,
  resetPasswordController,
  refreshController,
  logoutController,
  googleAuth,
} from "./auth.controller.js";

import { validate } from "../../middlewares/validate.middleware.js";

import { requireAuth } from "../../middlewares/auth.middleware.js";

import {
  authLimiter,
  refreshLimiter,
} from "../../middlewares/rateLimit.middleware.js";

import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  googleAuthSchema,
} from "./auth.schema.js";

const router = Router();

router.post("/register", authLimiter, validate(registerSchema), register);

router.post("/login", authLimiter, validate(loginSchema), login);

/**
 * Vérification publique du lien reçu par e-mail.
 *
 * Exemple :
 * GET /auth/verifier-email?token=abc123
 */
router.get("/verifier-email", verifyEmailController);

/**
 * Renvoi d'un nouvel e-mail.
 *
 * La route utilise le JWT de la session créée
 * juste après l'inscription.
 */
router.post(
  "/renvoyer-verification",
  requireAuth,
  resendEmailVerificationController,
);

/**
 * Demande de réinitialisation de mot de passe (envoie l'e-mail).
 *
 * Route publique, protégée par le même rate-limiter que login/register
 * pour éviter le spam d'e-mails / l'énumération de comptes.
 */
router.post(
  "/mot-de-passe-oublie",
  authLimiter,
  validate(forgotPasswordSchema),
  forgotPasswordController,
);

/**
 * Réinitialisation effective du mot de passe à partir du token reçu par e-mail.
 */
router.post(
  "/reinitialiser-mot-de-passe",
  authLimiter,
  validate(resetPasswordSchema),
  resetPasswordController,
);

router.get("/me", requireAuth, me);

router.post("/refresh", refreshLimiter, refreshController);
router.post("/logout", requireAuth, logoutController);
router.post("/google", authLimiter, validate(googleAuthSchema), googleAuth);

export default router;
