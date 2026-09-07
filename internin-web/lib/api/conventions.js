import { apiFetch } from "@/lib/api/client";

// ── Stagiaire ──────────────────────────────────────────────────────────────

export function getMaConventionRequest(token) {
  return apiFetch("/conventions/moi", { token });
}

export function signerMaConventionRequest(token) {
  return apiFetch("/conventions/moi/signer", {
    method: "POST",
    token,
  });
}

// ── Entreprise ─────────────────────────────────────────────────────────────

export function listConventionsEntrepriseRequest(token, params = {}) {
  const qs = new URLSearchParams();
  if (params.recherche) qs.set("recherche", params.recherche);
  if (params.statut) qs.set("statut", params.statut);
  const q = qs.toString();
  return apiFetch(`/conventions/entreprise${q ? `?${q}` : ""}`, { token });
}

export function getStatsConventionsEntrepriseRequest(token) {
  return apiFetch("/conventions/entreprise/stats", { token });
}

export function getActionsRequisesConventionsRequest(token) {
  return apiFetch("/conventions/entreprise/actions-requises", { token });
}

export function getConventionEntrepriseRequest(token, id) {
  return apiFetch(`/conventions/entreprise/${id}`, { token });
}

export function signerConventionEntrepriseRequest(token, id) {
  return apiFetch(`/conventions/entreprise/${id}/signer`, {
    method: "POST",
    token,
  });
}

/** URL relative protégée pour téléchargement PDF (utiliser avec Authorization). */
export function conventionEntreprisePdfUrl(id, disposition = "attachment", lang = "fr") {
  const l = lang === "en" ? "en" : "fr";
  return `/conventions/entreprise/${id}/pdf?disposition=${disposition}&lang=${l}`;
}
