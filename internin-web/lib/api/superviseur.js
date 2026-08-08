import { apiFetch } from "./client";

export function getTableauDeBordSuperviseurRequest(token) {
  return apiFetch("/superviseur/tableau-de-bord", { token });
}

export function listMesStagiairesRequest(token) {
  return apiFetch("/superviseur/stagiaires", { token });
}

export function getDetailStagiaireRequest(idStage, token) {
  return apiFetch(`/superviseur/stagiaires/${idStage}`, { token });
}

// -----------------------------------------------------------------------
// Suivi de progression
// -----------------------------------------------------------------------

export function getProgressionRequest(idStage, token) {
  return apiFetch(`/superviseur/stagiaires/${idStage}/progression`, { token });
}

export function updateProgressionManuelleRequest(
  idStage,
  progressionPourcentage,
  token,
) {
  return apiFetch(`/superviseur/stagiaires/${idStage}/progression`, {
    method: "PATCH",
    body: { progressionPourcentage },
    token,
  });
}

export function ajouterObjectifRequest(idStage, description, token) {
  return apiFetch(`/superviseur/stagiaires/${idStage}/objectifs`, {
    method: "POST",
    body: { description },
    token,
  });
}

export function updateObjectifRequest(idStage, idObjectif, payload, token) {
  return apiFetch(
    `/superviseur/stagiaires/${idStage}/objectifs/${idObjectif}`,
    {
      method: "PATCH",
      body: payload,
      token,
    },
  );
}

export function supprimerObjectifRequest(idStage, idObjectif, token) {
  return apiFetch(
    `/superviseur/stagiaires/${idStage}/objectifs/${idObjectif}`,
    {
      method: "DELETE",
      token,
    },
  );
}

export function ajouterTacheRequest(idStage, description, token) {
  return apiFetch(`/superviseur/stagiaires/${idStage}/taches`, {
    method: "POST",
    body: { description },
    token,
  });
}

export function updateTacheRequest(idStage, idTache, payload, token) {
  return apiFetch(`/superviseur/stagiaires/${idStage}/taches/${idTache}`, {
    method: "PATCH",
    body: payload,
    token,
  });
}

export function supprimerTacheRequest(idStage, idTache, token) {
  return apiFetch(`/superviseur/stagiaires/${idStage}/taches/${idTache}`, {
    method: "DELETE",
    token,
  });
}

export function ajouterCompetenceAcquiseRequest(idStage, idCompetence, token) {
  return apiFetch(`/superviseur/stagiaires/${idStage}/competences`, {
    method: "POST",
    body: { idCompetence },
    token,
  });
}

export function supprimerCompetenceAcquiseRequest(
  idStage,
  idAcquisition,
  token,
) {
  return apiFetch(
    `/superviseur/stagiaires/${idStage}/competences/${idAcquisition}`,
    {
      method: "DELETE",
      token,
    },
  );
}

export function ajouterObservationRequest(idStage, contenu, token) {
  return apiFetch(`/superviseur/stagiaires/${idStage}/observations`, {
    method: "POST",
    body: { contenu },
    token,
  });
}

export function supprimerObservationRequest(idStage, idObservation, token) {
  return apiFetch(
    `/superviseur/stagiaires/${idStage}/observations/${idObservation}`,
    {
      method: "DELETE",
      token,
    },
  );
}

// -----------------------------------------------------------------------
// Journal de stage (consultation + modération)
// -----------------------------------------------------------------------

export function getJournalSuperviseurRequest(idStage, token) {
  return apiFetch(`/superviseur/stagiaires/${idStage}/journal`, { token });
}

export function modererEntreeJournalRequest(idStage, idEntree, payload, token) {
  return apiFetch(`/superviseur/stagiaires/${idStage}/journal/${idEntree}`, {
    method: "PATCH",
    body: payload,
    token,
  });
}

// -----------------------------------------------------------------------
// Évaluations hebdomadaires
// -----------------------------------------------------------------------

export function listEvaluationsSuperviseurRequest(token) {
  return apiFetch("/superviseur/evaluations", { token });
}

export function getEvaluationDetailRequest(idStage, idEvaluation, token) {
  return apiFetch(
    `/superviseur/stagiaires/${idStage}/evaluations/${idEvaluation}`,
    { token },
  );
}

export function creerEvaluationRequest(idStage, payload, token) {
  return apiFetch(`/superviseur/stagiaires/${idStage}/evaluations`, {
    method: "POST",
    body: payload,
    token,
  });
}

export function modifierEvaluationRequest(
  idStage,
  idEvaluation,
  payload,
  token,
) {
  return apiFetch(
    `/superviseur/stagiaires/${idStage}/evaluations/${idEvaluation}`,
    {
      method: "PATCH",
      body: payload,
      token,
    },
  );
}