import { apiFetch } from "./client";

export function getEtatVueRequest(ressource) {
  return apiFetch(`/etats-vue/${encodeURIComponent(ressource)}`);
}

export function markEtatVueRequest(ressource, payload = { action: "section" }) {
  return apiFetch(`/etats-vue/${encodeURIComponent(ressource)}`, {
    method: "PATCH",
    body: payload,
  });
}
