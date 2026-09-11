import { apiFetch } from "./client";

export function getEtatVueRequest(ressource, token) {
  return apiFetch(`/etats-vue/${encodeURIComponent(ressource)}`, { token });
}

export function markEtatVueRequest(
  ressource,
  payload = { action: "section" },
  token,
) {
  return apiFetch(`/etats-vue/${encodeURIComponent(ressource)}`, {
    method: "PATCH",
    body: payload,
    token,
  });
}
