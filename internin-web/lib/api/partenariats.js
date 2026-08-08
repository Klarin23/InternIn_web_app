import { apiFetch } from "./client";

// --- Côté université ---

export function getEntreprisesDecouvrirRequest(recherche, token) {
  const query = recherche ? `?recherche=${encodeURIComponent(recherche)}` : "";
  return apiFetch(`/partenariats/entreprises-disponibles${query}`, { token });
}

export function getInvitationsEnvoyeesRequest(token) {
  return apiFetch("/partenariats/mes-invitations-envoyees", { token });
}

export function envoyerInvitationRequest(idEntreprise, message, token) {
  return apiFetch("/partenariats", {
    method: "POST",
    body: { idEntreprise, message },
    token,
  });
}

// --- Côté entreprise ---

export function getInvitationsRecuesRequest(token) {
  return apiFetch("/partenariats/recues", { token });
}

export function getUniversitesPartenairesRequest(token) {
  return apiFetch("/partenariats/mes-universites-partenaires", { token });
}

export function repondreInvitationRequest(idPartenariat, accepter, token) {
  return apiFetch(`/partenariats/${idPartenariat}/reponse`, {
    method: "PATCH",
    body: { accepter },
    token,
  });
}
