import { apiFetch } from "./client";

export function createEvaluationRequest(payload, token) {
  return apiFetch("/evaluations", { method: "POST", body: payload, token });
}

export function listEvaluationsRequest(idStage, token) {
  return apiFetch(`/evaluations/stage/${idStage}`, { token });
}

export function listCoachingRequest(idStage, token) {
  return apiFetch(`/evaluations/coaching/stage/${idStage}`, { token });
}
