import { apiFetch } from "./client";

export function getCompetencesRequest() {
  return apiFetch("/referentiels/competences");
}

export function getCentresInteretRequest() {
  return apiFetch("/referentiels/centres-interet");
}

export function getObjectifsRequest() {
  return apiFetch("/referentiels/objectifs-developpement");
}