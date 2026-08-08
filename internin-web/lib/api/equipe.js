import { apiFetch } from "./client";

export function getCatalogueEquipeRequest(token) {
  return apiFetch("/equipe/catalogue", { token });
}

export function listMembresEquipeRequest(
  token,
  { recherche, role, statut } = {},
) {
  const params = new URLSearchParams();
  if (recherche) params.set("recherche", recherche);
  if (role) params.set("role", role);
  if (statut) params.set("statut", statut);
  const query = params.toString();
  return apiFetch(`/equipe/membres${query ? `?${query}` : ""}`, { token });
}

export function inviterMembreRequest(payload, token) {
  return apiFetch("/equipe/membres/invitations", {
    method: "POST",
    body: payload,
    token,
  });
}

export function renvoyerInvitationRequest(idMembre, token) {
  return apiFetch(`/equipe/membres/${idMembre}/invitations/renvoyer`, {
    method: "POST",
    token,
  });
}

export function annulerInvitationRequest(idMembre, token) {
  return apiFetch(`/equipe/membres/${idMembre}/invitations`, {
    method: "DELETE",
    token,
  });
}

export function updateMembreRequest(idMembre, payload, token) {
  return apiFetch(`/equipe/membres/${idMembre}`, {
    method: "PATCH",
    body: payload,
    token,
  });
}

export function updateStatutMembreRequest(idMembre, statutMembre, token) {
  return apiFetch(`/equipe/membres/${idMembre}/statut`, {
    method: "PATCH",
    body: { statutMembre },
    token,
  });
}

export function listAffectationsRequest(token) {
  return apiFetch("/equipe/affectations", { token });
}

export function affecterSuperviseurRequest(payload, token) {
  return apiFetch("/equipe/affectations", {
    method: "POST",
    body: payload,
    token,
  });
}

export function retirerAffectationRequest(idStage, token) {
  return apiFetch(`/equipe/affectations/${idStage}`, {
    method: "DELETE",
    token,
  });
}

export function listActivitesEquipeRequest(token) {
  return apiFetch("/equipe/activites", { token });
}

export function getParametresEquipeRequest(token) {
  return apiFetch("/equipe/parametres", { token });
}

export function updateParametresEquipeRequest(payload, token) {
  return apiFetch("/equipe/parametres", {
    method: "PATCH",
    body: payload,
    token,
  });
}

// Routes publiques (pas de session) — flux d'acceptation d'invitation.
export function getMonProfilRequest(token) {
  return apiFetch("/equipe/moi", { token });
}

export function getInvitationRequest(token) {
  return apiFetch(`/equipe/invitations/${token}`);
}

export function accepterInvitationRequest(token, motDePasse) {
  return apiFetch(`/equipe/invitations/${token}/accepter`, {
    method: "POST",
    body: { motDePasse },
  });
}


