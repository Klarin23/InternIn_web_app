import { apiFetch } from "./client";

export function listOffresRequest(filters = {}) {
  // Ne garde que les filtres réellement définis — URLSearchParams
  // convertirait sinon `undefined` en la chaîne littérale "undefined"
  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== "",
    ),
  );
  const params = new URLSearchParams(cleanFilters).toString();
  return apiFetch(`/offres${params ? `?${params}` : ""}`);
}

export function getOffreRequest(id) {
  return apiFetch(`/offres/${id}`);
}

export function listMesOffresRequest(token) {
  return apiFetch("/offres/mes-offres", { token });
}

export function createOffreRequest(payload, token) {
  return apiFetch("/offres", { method: "POST", body: payload, token });
}

export function getOffreEntrepriseRequest(id, token) {
  return apiFetch(`/offres/entreprise/${id}`, { token });
}

export function updateOffreRequest(id, payload, token) {
  return apiFetch(`/offres/${id}`, { method: "PATCH", body: payload, token });
}

export function deleteOffreRequest(id, token) {
  return apiFetch(`/offres/${id}`, { method: "DELETE", token });
}

export function dupliquerOffreRequest(id, token) {
  return apiFetch(`/offres/${id}/dupliquer`, { method: "POST", token });
}