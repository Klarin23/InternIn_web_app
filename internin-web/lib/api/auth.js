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

export async function refreshTokenRequest() {
  // Le refresh token est transmis uniquement via le cookie HttpOnly (credentials: include)
  return apiFetch("/auth/refresh", { method: "POST", body: {} });
}

export function logoutRequest(_refreshTokenIgnored, token) {
  // Le refresh token est lu côté serveur depuis le cookie HttpOnly
  return apiFetch("/auth/logout", {
    method: "POST",
    body: {},
    token,
  });
}

export async function googleAuthRequest({
  idToken,
  accessToken,
  typeUtilisateur,
}) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

  const response = await fetch(`${API_URL}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      idToken: idToken || undefined,
      accessToken: accessToken || undefined,
      typeUtilisateur: typeUtilisateur || undefined,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const err = new Error(
      data.error || data.message || "Connexion Google échouée",
    );
    err.status = response.status;
    err.code = data.code;
    throw err;
  }

  return data; // { user, token, isNewUser }
}