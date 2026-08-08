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