import { apiFetch } from "./client";

export function createLitigeRequest(payload, token) {
  return apiFetch("/litiges", { method: "POST", body: payload, token });
}

// Réservé à l'espace Administrateur.
export function listLitigesRequest(token, statut) {
  const query = statut ? `?statut=${encodeURIComponent(statut)}` : "";
  return apiFetch(`/litiges${query}`, { token });
}

export function changerStatutLitigeRequest(id, statut, token) {
  return apiFetch(`/litiges/${id}/statut`, {
    method: "PATCH",
    body: { statut },
    token,
  });
}
