import { apiFetch } from "./client";

export function listPropositionsStagiaireRequest(token) {
  return apiFetch("/propositions/stagiaire", { token });
}

export function listPropositionsEntrepriseRequest(token) {
  return apiFetch("/propositions/entreprise", { token });
}

/**
 * @param {string} idProposition
 * @param {{ statut: string, commentaireReponse?: string|null }} payload
 * @param {string} token
 */
export function updatePropositionStatutRequest(idProposition, payload, token) {
  const body =
    typeof payload === "string"
      ? { statut: payload }
      : {
          statut: payload.statut,
          commentaireReponse: payload.commentaireReponse ?? null,
        };
  return apiFetch(`/propositions/${idProposition}`, {
    method: "PATCH",
    body,
    token,
  });
}
