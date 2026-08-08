import { apiFetch } from "./client";

export function postulerRequest(payload, token) {
  return apiFetch("/candidatures", { method: "POST", body: payload, token });
}

export function getMesCandidaturesRequest(token) {
  return apiFetch("/candidatures/mes-candidatures", { token });
}

export function getCandidatureStatutRequest(idOffre, token) {
  return apiFetch(`/candidatures/statut/${idOffre}`, { token });
}

export function listCandidaturesEntrepriseRequest(token, idOffre) {
  const query = idOffre ? `?idOffre=${idOffre}` : "";
  return apiFetch(`/candidatures/entreprise${query}`, { token });
}

export function listCandidatsRecommandesRequest(token) {
  return apiFetch("/candidatures/entreprise/recommandees", { token });
}

export function updateCandidatureStatutRequest(idCandidature, statut, token) {
  return apiFetch(`/candidatures/entreprise/${idCandidature}/statut`, {
    method: "PATCH",
    body: { statut },
    token,
  });
}

export function rejeterCandidatureRequest(idEntretien, token) {
  return apiFetch(`/candidatures/entreprise/entretien/${idEntretien}/rejeter`, {
    method: "PATCH",
    token,
  });
}

export function getHistoriqueCandidatureRequest(idCandidature, token) {
  return apiFetch(`/candidatures/entreprise/${idCandidature}/historique`, {
    token,
  });
}

export function signalerConsultationCvRequest(idCandidature, token) {
  return apiFetch(`/candidatures/entreprise/${idCandidature}/cv-consulte`, {
    method: "POST",
    token,
  });
}

export function getEvaluationRequest(idCandidature, token) {
  return apiFetch(`/candidatures/entreprise/${idCandidature}/evaluation`, {
    token,
  });
}

export function updateEvaluationRequest(idCandidature, payload, token) {
  return apiFetch(`/candidatures/entreprise/${idCandidature}/evaluation`, {
    method: "PUT",
    body: payload,
    token,
  });
}

export function getNotesRequest(idCandidature, token) {
  return apiFetch(`/candidatures/entreprise/${idCandidature}/notes`, { token });
}

export function ajouterNoteRequest(idCandidature, contenu, token) {
  return apiFetch(`/candidatures/entreprise/${idCandidature}/notes`, {
    method: "POST",
    body: { contenu },
    token,
  });
}