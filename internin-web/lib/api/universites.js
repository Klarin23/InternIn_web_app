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

export function creerInvitationEtudiantRequest(email, token) {
  return apiFetch("/rattachements-universite/universites/moi/invitations", {
    method: "POST",
    body: { email },
    token,
  });
}

export function getDemandesRattachementUniversiteRequest(token) {
  return apiFetch("/rattachements-universite/universites/moi/demandes", {
    token,
  });
}

export function confirmerDemandeRattachementRequest(idRattachement, token) {
  return apiFetch(
    `/rattachements-universite/universites/moi/demandes/${idRattachement}/confirmer`,
    { method: "POST", token },
  );
}

export function refuserDemandeRattachementRequest(idRattachement, token) {
  return apiFetch(
    `/rattachements-universite/universites/moi/demandes/${idRattachement}/refuser`,
    { method: "POST", token },
  );
}

export function creerCodeRattachementRequest(token) {
  return apiFetch("/rattachements-universite/universites/moi/code", {
    method: "POST",
    token,
  });
}

export function getCodeRattachementRequest(token) {
  return apiFetch("/rattachements-universite/universites/moi/code", { token });
}

export function creerLienRattachementRequest(token) {
  return apiFetch("/rattachements-universite/universites/moi/lien", {
    method: "POST",
    token,
  });
}

export function getRattachementEtudiantRequest(token) {
  return apiFetch("/rattachements-universite/stagiaires/moi/rattachement", {
    token,
  });
}

export function getInvitationUniversiteRequest(rawToken) {
  return apiFetch(
    `/rattachements-universite/invitations/${encodeURIComponent(rawToken)}`,
  );
}

export function accepterInvitationUniversiteRequest(rawToken, token) {
  return apiFetch(
    `/rattachements-universite/invitations/${encodeURIComponent(rawToken)}/accepter`,
    { method: "POST", token },
  );
}

export function refuserInvitationUniversiteRequest(rawToken, token) {
  return apiFetch(
    `/rattachements-universite/invitations/${encodeURIComponent(rawToken)}/refuser`,
    { method: "POST", token },
  );
}

export function rejoindreUniversiteParCodeRequest(code, token) {
  return apiFetch("/rattachements-universite/stagiaires/moi/rattachement/code", {
    method: "POST",
    body: { code },
    token,
  });
}

export function rejoindreUniversiteParLienRequest(rawToken, token) {
  return apiFetch(
    `/rattachements-universite/stagiaires/moi/rattachement/lien/${encodeURIComponent(rawToken)}`,
    { method: "POST", token },
  );
}

export function getMaitresDeStageUniversiteRequest(token, params = {}) {
  const query = new URLSearchParams();
  if (params.recherche) query.set("recherche", params.recherche);
  if (params.entreprise) query.set("entreprise", params.entreprise);
  if (params.statut) query.set("statut", params.statut);
  if (params.encadrement) query.set("encadrement", params.encadrement);
  if (params.page) query.set("page", String(params.page));
  if (params.parPage) query.set("parPage", String(params.parPage));
  if (params.tri) query.set("tri", params.tri);
  if (params.ordre) query.set("ordre", params.ordre);
  const qs = query.toString();
  return apiFetch(`/universites/maitres-de-stage${qs ? `?${qs}` : ""}`, { token });
}

export function getMaitreDeStageUniversiteDetailRequest(idMembre, token) {
  return apiFetch(`/universites/maitres-de-stage/${encodeURIComponent(idMembre)}`, { token });
}
