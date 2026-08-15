import { apiFetch } from "./client";

export function completeOnboardingEntrepriseRequest(payload, token) {
  return apiFetch("/entreprises/onboarding", {
    method: "POST",
    body: payload,
    token,
  });
}

export function getEntrepriseProfileRequest(token) {
  return apiFetch("/entreprises/me", { token });
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export function updateEntrepriseProfileRequest(payload, token) {
  return apiFetch("/entreprises/me", {
    method: "PATCH",
    body: payload,
    token,
  });
}

export async function uploadLogoEntrepriseRequest(file, token) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/entreprises/me/logo`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Échec de l'envoi du logo");
  }
  return data;
}