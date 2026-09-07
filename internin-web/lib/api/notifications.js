import { apiFetch } from "./client";

export function listNotificationsRequest(token) {
  return apiFetch("/notifications", { token });
}

export function compterNotificationsNonLuesRequest(token) {
  return apiFetch("/notifications/non-lues/compte", { token });
}

export function marquerNotificationLueRequest(id, token) {
  return apiFetch(`/notifications/${id}/lue`, { method: "PATCH", token });
}

export function marquerToutesNotificationsLuesRequest(token) {
  return apiFetch("/notifications/lues-toutes", { method: "PATCH", token });
}

export function supprimerNotificationRequest(id, token) {
  return apiFetch(`/notifications/${id}`, { method: "DELETE", token });
}

export function supprimerToutesNotificationsRequest(token) {
  return apiFetch("/notifications/toutes", { method: "DELETE", token });
}
export function listNotificationsAdminRequest(token, params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "" && v !== "toutes" && v !== "tous") qs.set(k, String(v));
  });
  const q = qs.toString();
  return apiFetch(`/notifications/admin/centre${q ? `?${q}` : ""}`, { token });
}

export function getNotificationsAdminStatsRequest(token) {
  return apiFetch(`/notifications/admin/stats`, { token });
}


/** Préférences de notifications de l'entreprise connectée (source de vérité BDD). */
export function getEntrepriseNotifPrefsRequest(token) {
  return apiFetch("/notifications/preferences", { token });
}

/** Mise à jour partielle ou complète des préférences entreprise. */
export function updateEntrepriseNotifPrefsRequest(payload, token) {
  return apiFetch("/notifications/preferences", {
    method: "PATCH",
    token,
    body: payload,
  });
}
