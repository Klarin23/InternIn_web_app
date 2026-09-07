import { apiFetch } from "./client";

export function listFavorisRequest(token) {
  return apiFetch("/favoris", { token });
}

export function countFavorisRequest(token) {
  return apiFetch("/favoris/count", { token });
}

export function addFavoriRequest(idOffre, token) {
  return apiFetch(`/favoris/${idOffre}`, { method: "POST", token });
}

export function removeFavoriRequest(idOffre, token) {
  return apiFetch(`/favoris/${idOffre}`, { method: "DELETE", token });
}
