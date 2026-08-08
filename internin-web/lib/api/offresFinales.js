import { apiFetch } from "./client";

export function createOffreFinaleRequest(payload, token) {
  return apiFetch("/offres-finales", { method: "POST", body: payload, token });
}

export function listOffresFinalesEnAttenteRequest(token) {
  return apiFetch("/offres-finales/en-attente", { token });
}

// Réservé à l'espace Administrateur — page de modération (tous statuts).
export function listToutesOffresFinalesRequest(token, statut) {
  const query = statut ? `?statut=${encodeURIComponent(statut)}` : "";
  return apiFetch(`/offres-finales${query}`, { token });
}

export function validerOffreFinaleRequest(
  id,
  statutValidationPlateforme,
  token,
) {
  return apiFetch(`/offres-finales/${id}/validation`, {
    method: "PATCH",
    body: { statutValidationPlateforme },
    token,
  });
}

export function listMesOffresFinalesRequest(token) {
  return apiFetch("/offres-finales/mes-offres", { token });
}

export function repondreOffreFinaleRequest(id, statutReponseStagiaire, token) {
  return apiFetch(`/offres-finales/${id}/reponse`, {
    method: "PATCH",
    body: { statutReponseStagiaire },
    token,
  });
}

export function getHistoriqueOffresFinalesRequest(idEntretien, token) {
  return apiFetch(`/offres-finales/historique/${idEntretien}`, { token });
}
