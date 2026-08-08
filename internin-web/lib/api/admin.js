import { apiFetch } from "./client";

export function getAdminProfileRequest(token) {
  return apiFetch("/admin/moi", { token });
}

export function getAdminStatsRequest(token) {
  return apiFetch("/admin/stats", { token });
}

export function listEntreprisesEnAttenteRequest(token) {
  return apiFetch("/admin/entreprises/en-attente", { token });
}

export function listToutesEntreprisesRequest(recherche, token) {
  const query = recherche ? `?recherche=${encodeURIComponent(recherche)}` : "";
  return apiFetch(`/admin/entreprises${query}`, { token });
}

export function changerStatutCompteEntrepriseRequest(id, statutCompte, token) {
  return apiFetch(`/admin/entreprises/${id}/statut-compte`, {
    method: "PATCH",
    body: { statutCompte },
    token,
  });
}

export function listUniversitesEnAttenteRequest(token) {
  return apiFetch("/admin/universites/en-attente", { token });
}

export function listToutesUniversitesRequest(recherche, token) {
  const query = recherche ? `?recherche=${encodeURIComponent(recherche)}` : "";
  return apiFetch(`/admin/universites${query}`, { token });
}

export function changerStatutCompteUniversiteRequest(id, statutCompte, token) {
  return apiFetch(`/admin/universites/${id}/statut-compte`, {
    method: "PATCH",
    body: { statutCompte },
    token,
  });
}

export function listTousUtilisateursRequest({ recherche, role } = {}, token) {
  const params = new URLSearchParams();
  if (recherche) params.set("recherche", recherche);
  if (role) params.set("role", role);
  const query = params.toString();
  return apiFetch(`/admin/utilisateurs${query ? `?${query}` : ""}`, { token });
}

export function changerStatutCompteUtilisateurRequest(id, statutCompte, token) {
  return apiFetch(`/admin/utilisateurs/${id}/statut-compte`, {
    method: "PATCH",
    body: { statutCompte },
    token,
  });
}

export function verifierEntrepriseRequest(id, statutVerification, token) {
  return apiFetch(`/admin/entreprises/${id}/verification`, {
    method: "PATCH",
    body: { statutVerification },
    token,
  });
}

export function verifierUniversiteRequest(id, statutVerification, token) {
  return apiFetch(`/admin/universites/${id}/verification`, {
    method: "PATCH",
    body: { statutVerification },
    token,
  });
}

export function getParametresRequest(token) {
  return apiFetch("/admin/parametres", { token });
}

export function updateParametresRequest(champs, token) {
  return apiFetch("/admin/parametres", {
    method: "PATCH",
    body: champs,
    token,
  });
}

export function listDocumentsEntrepriseRequest(idEntreprise, token) {
  return apiFetch(`/admin/entreprises/${idEntreprise}/documents`, { token });
}
