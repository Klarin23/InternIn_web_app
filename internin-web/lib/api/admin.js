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

export function changerStatutCompteEntrepriseRequest(id, statutCompte, token, extra = {}) {
  return apiFetch(`/admin/entreprises/${id}/statut-compte`, {
    method: "PATCH",
    body: { statutCompte, ...extra },
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

export function listTousUtilisateursRequest({ recherche, role, statut } = {}, token) {
  const params = new URLSearchParams();
  if (recherche) params.set("recherche", recherche);
  if (role) params.set("role", role);
  if (statut) params.set("statut", statut);
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

export function verifierEntrepriseRequest(id, statutVerification, token, extra = {}) {
  return apiFetch(`/admin/entreprises/${id}/verification`, {
    method: "PATCH",
    body: { statutVerification, ...extra },
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

export function getUtilisateursAdminStatsRequest(token) {
  return apiFetch("/admin/utilisateurs/stats", { token });
}
export function getUtilisateurAdminDetailRequest(id, token) {
  return apiFetch(`/admin/utilisateurs/${id}`, { token });
}
export function listUtilisateurDocumentsRequest(id, token) {
  return apiFetch(`/admin/utilisateurs/${id}/documents`, { token });
}
export function listUtilisateurCandidaturesRequest(id, token) {
  return apiFetch(`/admin/utilisateurs/${id}/candidatures`, { token });
}
export function listUtilisateurStagesRequest(id, token) {
  return apiFetch(`/admin/utilisateurs/${id}/stages`, { token });
}
export function listUtilisateurSignalementsRequest(id, token) {
  return apiFetch(`/admin/utilisateurs/${id}/signalements`, { token });
}
export function listUtilisateurSessionsRequest(id, token) {
  return apiFetch(`/admin/utilisateurs/${id}/sessions`, { token });
}

export function actionsMasseEntreprisesRequest(payload, token) {
  return apiFetch("/admin/entreprises/actions-masse", {
    method: "POST",
    body: payload,
    token,
  });
}

export function getEntrepriseRiskScoreRequest(idEntreprise, token) {
  return apiFetch(`/admin/entreprises/${idEntreprise}/risk-score`, { token });
}

export function listEntrepriseJournalRequest(idEntreprise, token) {
  return apiFetch(`/admin/entreprises/${idEntreprise}/journal`, { token });
}

export function getEntrepriseAdminStatsRequest(idEntreprise, token) {
  return apiFetch(`/admin/entreprises/${idEntreprise}/stats`, { token });
}

export function listEntrepriseEquipeRequest(idEntreprise, token) {
  return apiFetch(`/admin/entreprises/${idEntreprise}/equipe`, { token });
}

export function listEntrepriseOffresRequest(idEntreprise, token) {
  return apiFetch(`/admin/entreprises/${idEntreprise}/offres`, { token });
}

export function listEntrepriseStagesRequest(idEntreprise, token) {
  return apiFetch(`/admin/entreprises/${idEntreprise}/stages`, { token });
}

export function listEntreprisePartenariatsRequest(idEntreprise, token) {
  return apiFetch(`/admin/entreprises/${idEntreprise}/partenariats`, { token });
}

export function listEntrepriseSignalementsRequest(idEntreprise, token) {
  return apiFetch(`/admin/entreprises/${idEntreprise}/signalements`, { token });
}

export function listStagesSupervisionRequest(token, params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "" && v !== "tous") qs.set(k, String(v));
  });
  const q = qs.toString();
  return apiFetch(`/admin/supervision/stages${q ? `?${q}` : ""}`, { token });
}

export function getStageSupervisionDetailRequest(token, id) {
  return apiFetch(`/admin/supervision/stages/${id}`, { token });
}

export function getControleCentreRequest(token, params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "" && v !== "toutes" && v !== "tous") qs.set(k, String(v));
  });
  const q = qs.toString();
  return apiFetch(`/admin/controle${q ? `?${q}` : ""}`, { token });
}

export function resolveAnomalieControleRequest(token, body) {
  return apiFetch(`/admin/controle/anomalies/resolve`, {
    method: "POST",
    body,
    token,
  });
}

export function getDetectionSettingsRequest(token) {
  return apiFetch(`/admin/controle/settings`, { token });
}

export function listAuditJournalRequest(token, params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "" && v !== "tous" && v !== "toutes" && v !== "all")
      qs.set(k, String(v));
  });
  const q = qs.toString();
  return apiFetch(`/admin/audit${q ? `?${q}` : ""}`, { token });
}

export function getAuditStatsRequest(token) {
  return apiFetch(`/admin/audit/stats`, { token });
}

export function getAuditEventRequest(token, id) {
  return apiFetch(`/admin/audit/${id}`, { token });
}

export function exportAuditJournalRequest(token, params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "" && v !== "tous" && v !== "toutes" && v !== "all")
      qs.set(k, String(v));
  });
  const q = qs.toString();
  return apiFetch(`/admin/audit/export${q ? `?${q}` : ""}`, { token });
}

export function listAdminConventionsRequest(token, params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "" && v !== "tous" && v !== "toutes") qs.set(k, String(v));
  });
  const q = qs.toString();
  return apiFetch(`/admin/conventions${q ? `?${q}` : ""}`, { token });
}

export function getAdminConventionsStatsRequest(token) {
  return apiFetch(`/admin/conventions/stats`, { token });
}

export function getAdminConventionDetailRequest(token, id) {
  return apiFetch(`/admin/conventions/${id}`, { token });
}

export function exportAdminConventionsRequest(token, params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "" && v !== "tous" && v !== "toutes") qs.set(k, String(v));
  });
  const q = qs.toString();
  return apiFetch(`/admin/conventions/export${q ? `?${q}` : ""}`, { token });
}

export function approuverConventionAdminRequest(token, id, motif) {
  return apiFetch(`/admin/conventions/${id}/approuver`, {
    method: "POST",
    token,
    body: JSON.stringify({ motif }),
  });
}

export function downloadAdminConventionPdfUrl(id, lang = "fr") {
  return `/admin/conventions/${id}/pdf?lang=${lang === "en" ? "en" : "fr"}`;
}

export function getSecurityOverviewRequest(token) {
  return apiFetch(`/admin/securite/overview`, { token });
}

export function listSecuritySessionsRequest(token, params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "") qs.set(k, String(v));
  });
  const q = qs.toString();
  return apiFetch(`/admin/securite/sessions${q ? `?${q}` : ""}`, { token });
}

export function revokeSecuritySessionRequest(token, id) {
  return apiFetch(`/admin/securite/sessions/${id}`, {
    method: "DELETE",
    token,
  });
}

export function revokeUserSessionsRequest(token, userId) {
  return apiFetch(`/admin/securite/utilisateurs/${userId}/sessions`, {
    method: "DELETE",
    token,
  });
}

export function listSecurityAdminsRequest(token) {
  return apiFetch(`/admin/securite/admins`, { token });
}

export function listComptesARisqueRequest(token) {
  return apiFetch(`/admin/securite/comptes-risque`, { token });
}


/** Alias de nommage (compat pages/hooks conventions-admin) */
export function listConventionsAdminRequest(token, params = {}) {
  return listAdminConventionsRequest(token, params);
}

export function getConventionAdminRequest(token, id) {
  return getAdminConventionDetailRequest(token, id);
}

export function getConventionAdminPdfUrl(id, lang = "fr") {
  return downloadAdminConventionPdfUrl(id, lang);
}

export function getConventionsAdminStatsRequest(token) {
  return getAdminConventionsStatsRequest(token);
}

/* Alertes de sécurité */
export function listSecurityAlertsRequest({ gravite, statut, page, limit } = {}, token) {
  const params = new URLSearchParams();
  if (gravite) params.set("gravite", gravite);
  if (statut) params.set("statut", statut);
  if (page) params.set("page", String(page));
  if (limit) params.set("limit", String(limit));
  const q = params.toString();
  return apiFetch(`/admin/securite/alertes${q ? `?${q}` : ""}`, { token });
}

export function getSecurityAlertsStatsRequest(token) {
  return apiFetch("/admin/securite/alertes/stats", { token });
}

export function getSecurityAlertRequest(id, token) {
  return apiFetch(`/admin/securite/alertes/${id}`, { token });
}

export function updateSecurityAlertStatusRequest(id, statut, token) {
  return apiFetch(`/admin/securite/alertes/${id}/statut`, {
    method: "PATCH",
    token,
    body: { statut },
  });
}
