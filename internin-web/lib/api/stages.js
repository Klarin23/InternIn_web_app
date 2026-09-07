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

export function listMesCertificatsRequest(token) {
  return apiFetch("/stages/mes-certificats", { token });
}

export function verifierCertificatRequest(code) {
  // Route publique
  return apiFetch(`/stages/verifier/${encodeURIComponent(code)}`);
}

/** Télécharge le PDF via fetch authentifié (blob).
 * @param {string} idStage
 * @param {string} token
 * @param {"fr"|"en"} [lang="fr"]
 */
export async function downloadCertificatRequest(idStage, token, lang = "fr") {
  const locale = String(lang || "fr").toLowerCase().startsWith("en") ? "en" : "fr";
  const qs = new URLSearchParams({ lang: locale });
  const res = await fetch(
    `/api/stages/${idStage}/certificat/download?${qs.toString()}`,
    {
      method: "GET",
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  );
  if (!res.ok) {
    let message = "Impossible de télécharger le certificat";
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/i);
  const filename =
    match?.[1] || `certificat-${idStage}-${locale}.pdf`;
  return { blob, filename, lang: locale };
}

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

/** Correction des dates de stage (entreprise, suite à anomalie critique). */
export function corrigerDatesStageRequest(idStage, dateDebut, token) {
  return apiFetch(`/stages/${idStage}/corriger-dates`, {
    method: "PATCH",
    body: { dateDebut },
    token,
  });
}
