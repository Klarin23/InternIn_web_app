import { apiFetch } from "./client";

export function createRecommandationRequest(idStage, contenu, token) {
  return apiFetch(`/recommandations/stage/${idStage}`, {
    method: "POST",
    body: { contenu },
    token,
  });
}

export function getRecommandationRequest(idStage, token) {
  return apiFetch(`/recommandations/stage/${idStage}`, { token });
}

export function toggleVisibiliteRequest(idStage, visibleLinkedin, token) {
  return apiFetch(`/recommandations/stage/${idStage}/visibilite`, {
    method: "PATCH",
    body: { visibleLinkedin },
    token,
  });
}
