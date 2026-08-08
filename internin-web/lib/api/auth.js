// Module API dédié à l'authentification.

import { apiFetch } from "./client";

export function registerRequest({ email, password, typeUtilisateur }) {
  return apiFetch("/auth/register", {
    method: "POST",
    body: {
      email,
      password,
      typeUtilisateur,
    },
  });
}

export function loginRequest({ email, password }) {
  return apiFetch("/auth/login", {
    method: "POST",
    body: {
      email,
      password,
    },
  });
}

export function meRequest(token) {
  return apiFetch("/auth/me", {
    token,
  });
}

/**
 * Vérifie le token reçu dans l'e-mail.
 */
export function verifyEmailRequest(token) {
  return apiFetch(`/auth/verifier-email?token=${encodeURIComponent(token)}`);
}

/**
 * Demande l'envoi d'un nouveau lien
 * de vérification.
 */
export function resendEmailVerificationRequest(token) {
  return apiFetch("/auth/renvoyer-verification", {
    method: "POST",
    token,
  });
}

/**
 * Demande l'envoi d'un e-mail de réinitialisation de mot de passe.
 */
export function forgotPasswordRequest(email) {
  return apiFetch("/auth/mot-de-passe-oublie", {
    method: "POST",
    body: { email },
  });
}

/**
 * Enregistre le nouveau mot de passe à partir du token reçu par e-mail.
 */
export function resetPasswordRequest({ token, password }) {
  return apiFetch("/auth/reinitialiser-mot-de-passe", {
    method: "POST",
    body: { token, password },
  });
}

export function refreshTokenRequest(refreshToken) {
  return apiFetch("/auth/refresh", {
    method: "POST",
    body: { refreshToken },
  });
}

export function logoutRequest(refreshToken, token) {
  return apiFetch("/auth/logout", {
    method: "POST",
    body: { refreshToken },
    token,
  });
}