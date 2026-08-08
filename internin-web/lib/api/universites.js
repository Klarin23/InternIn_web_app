import { apiFetch } from "./client";

export function completeOnboardingUniversiteRequest(payload, token) {
  return apiFetch("/universites/onboarding", {
    method: "POST",
    body: payload,
    token,
  });
}

export function getUniversiteProfileRequest(token) {
  return apiFetch("/universites/moi", { token });
}

export function updateUniversiteProfileRequest(payload, token) {
  return apiFetch("/universites/moi", {
    method: "PATCH",
    body: payload,
    token,
  });
}

export function getUniversiteStatsRequest(token) {
  return apiFetch("/universites/stats", { token });
}

export function getEtudiantsUniversiteRequest(token, params = {}) {
  const query = new URLSearchParams();
  if (params.recherche) query.set("recherche", params.recherche);
  if (params.statut) query.set("statut", params.statut);
  query.set("page", params.page || 1);
  query.set("parPage", params.parPage || 20);

  return apiFetch(`/universites/etudiants?${query.toString()}`, { token });
}

export function getEntreprisesUniversiteRequest(token, recherche) {
  const query = recherche ? `?recherche=${encodeURIComponent(recherche)}` : "";
  return apiFetch(`/universites/entreprises${query}`, { token });
}

export function getConventionsUniversiteRequest(token, params = {}) {
  const query = new URLSearchParams();
  if (params.recherche) query.set("recherche", params.recherche);
  if (params.statut) query.set("statut", params.statut);
  const qs = query.toString();
  return apiFetch(`/universites/conventions${qs ? `?${qs}` : ""}`, { token });
}

export function validerConventionRequest(idConvention, valider, token) {
  return apiFetch(`/universites/conventions/${idConvention}/valider`, {
    method: "POST",
    body: { valider },
    token,
  });
}

export function genererPdfConventionRequest(idConvention, token) {
  return apiFetch(`/universites/conventions/${idConvention}/pdf`, { token });
}

export function getStatistiquesUniversiteRequest(token) {
  return apiFetch("/universites/statistiques", { token });
}