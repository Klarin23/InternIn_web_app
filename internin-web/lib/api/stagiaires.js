import { apiFetch } from "./client";

export function completeOnboardingRequest(payload, token) {
  return apiFetch("/stagiaires/onboarding", {
    method: "POST",
    body: payload,
    token,
  });
}

export function getStagiaireProfileRequest(token) {
  return apiFetch("/stagiaires/me", { token });
}

export function updateStagiaireProfileRequest(payload, token) {
  return apiFetch("/stagiaires/me", {
    method: "PATCH",
    body: payload,
    token,
  });
}

// Upload de la photo de profil : FormData, donc pas apiFetch (comme
// uploadDocumentRequest dans lib/api/documents.js).
//
// Étape 2/4 : passe par le proxy Next.js ("/api/...") comme apiFetch,
// au lieu de l'URL Railway en direct — voir lib/api/client.js.
const API_URL = "/api";

export async function uploadPhotoProfilRequest(file, token) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/stagiaires/me/photo`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Échec de l'envoi de la photo");
  }

  return data;
}

export function updateStagiairePrivacyRequest(payload, token) {
  return apiFetch("/stagiaires/me/privacy", {
    method: "PATCH",
    body: payload,
    token,
  });
}
