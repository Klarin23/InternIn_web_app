import { apiFetch } from "./client";

export function getMonStageRequest(token) {
  return apiFetch("/stages/mon-stage", { token });
}

export function listMesStagesRequest(token) {
  return apiFetch("/stages/mes-stages", { token });
}

export function terminerStageRequest(id, token) {
  return apiFetch(`/stages/${id}/terminer`, { method: "PATCH", token });
}

export function getCertificatRequest(idStage, token) {
  return apiFetch(`/stages/${idStage}/certificat`, { token });
}

// -----------------------------------------------------------------------
// Journal de stage / activités
// -----------------------------------------------------------------------

export function listMonJournalRequest(idStage, token) {
  return apiFetch(`/stages/${idStage}/journal`, { token });
}

export function ajouterEntreeJournalRequest(idStage, payload, token) {
  return apiFetch(`/stages/${idStage}/journal`, {
    method: "POST",
    body: payload,
    token,
  });
}

export function updateEntreeJournalRequest(idStage, idEntree, payload, token) {
  return apiFetch(`/stages/${idStage}/journal/${idEntree}`, {
    method: "PATCH",
    body: payload,
    token,
  });
}

export function supprimerEntreeJournalRequest(idStage, idEntree, token) {
  return apiFetch(`/stages/${idStage}/journal/${idEntree}`, {
    method: "DELETE",
    token,
  });
}
