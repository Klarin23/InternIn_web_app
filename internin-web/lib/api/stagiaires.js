import { apiFetch } from "./client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

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
