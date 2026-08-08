import { apiFetch } from "./client";

export function planifierEntretienRequest(payload, token) {
  return apiFetch("/entretiens", { method: "POST", body: payload, token });
}

export function getMesEntretiensRequest(token) {
  return apiFetch("/entretiens/mes-entretiens", { token });
}

export function getEntretiensEntrepriseRequest(token) {
  return apiFetch("/entretiens/entreprise", { token });
}

export function getEntretiensEnAttenteRequest(token) {
  return apiFetch("/entretiens/entreprise/en-attente", { token });
}

export function updateEntretienEntrepriseRequest(id, payload, token) {
  return apiFetch(`/entretiens/entreprise/${id}`, {
    method: "PATCH",
    body: payload,
    token,
  });
}

export function validerEntretienRequest(id, token) {
  return apiFetch(`/entretiens/${id}/valider`, { method: "PATCH", token });
}

export function demanderReprogrammationRequest(
  id,
  dateHeureProposee,
  retourEntretien,
  token,
) {
  return apiFetch(`/entretiens/${id}/reprogrammation`, {
    method: "PATCH",
    body: { dateHeureProposee, retourEntretien },
    token,
  });
}


export function annulerEntretienRequest(id, raisonAnnulation, token) {
  return apiFetch(`/entretiens/${id}/annuler`, {
    method: "PATCH",
    body: { raisonAnnulation },
    token,
  });
}

export function getDisponibilitesCandidatRequest(idEntretien, token) {
  return apiFetch(`/entretiens/${idEntretien}/disponibilites-candidat`, {
    token,
  });
}

export function enregistrerNotesPreparationRequest(id, notesPreparation, token) {
  return apiFetch(`/entretiens/${id}/notes-preparation`, {
    method: "PATCH",
    body: { notesPreparation },
    token,
  });
}