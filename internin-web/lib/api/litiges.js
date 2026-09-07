import { apiFetch } from "./client";

export function createLitigeRequest(payload, token) {
  return apiFetch("/litiges", { method: "POST", body: payload, token });
}

export function listMesLitigesRequest(token) {
  return apiFetch("/litiges/mes", { token });
}

export function getLitigeRequest(id, token) {
  return apiFetch(`/litiges/${id}`, { token });
}

export function listLitigesRequest(token, statut) {
  const query = statut ? `?statut=${encodeURIComponent(statut)}` : "";
  return apiFetch(`/litiges${query}`, { token });
}

export function changerStatutLitigeRequest(id, { statut, motif }, token) {
  return apiFetch(`/litiges/${id}/statut`, {
    method: "PATCH",
    body: { statut, ...(motif != null && motif !== "" ? { motif } : {}) },
    token,
  });
}

export function listNotesLitigeRequest(id, token) {
  return apiFetch(`/litiges/${id}/notes`, { token });
}

export function addNoteLitigeRequest(id, contenu, token) {
  return apiFetch(`/litiges/${id}/notes`, {
    method: "POST",
    body: { contenu },
    token,
  });
}

export function listMessagesLitigeRequest(id, token) {
  return apiFetch(`/litiges/${id}/messages`, { token });
}

export function addMessageLitigeRequest(id, contenu, token) {
  return apiFetch(`/litiges/${id}/messages`, {
    method: "POST",
    body: { contenu },
    token,
  });
}

export function escaladerLitigeRequest(id, motif, token) {
  return apiFetch(`/litiges/${id}/escalader`, {
    method: "POST",
    body: { motif },
    token,
  });
}

export function demanderInfoLitigeRequest(id, message, token) {
  return apiFetch(`/litiges/${id}/demander-info`, {
    method: "POST",
    body: { message },
    token,
  });
}

export function listPiecesLitigeRequest(id, token) {
  return apiFetch(`/litiges/${id}/pieces`, { token });
}

export function uploadPieceLitigeRequest(id, file, token) {
  const form = new FormData();
  form.append("fichier", file);
  return apiFetch(`/litiges/${id}/pieces`, {
    method: "POST",
    body: form,
    token,
    // apiFetch should not force JSON Content-Type for FormData
  });
}


export function listHistoriqueLitigeRequest(id, token) {
  return apiFetch(`/litiges/${id}/historique`, { token });
}

export function actionDisciplinaireLitigeRequest(id, { type, motif }, token) {
  return apiFetch(`/litiges/${id}/action-disciplinaire`, {
    method: "POST",
    body: { type, motif },
    token,
  });
}

export async function downloadPieceLitigeRequest(pieceId, token) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`/api/litiges/pieces/${pieceId}/download`, {
    headers,
    credentials: "include",
  });
  if (!res.ok) {
    let msg = "Download failed";
    try {
      const j = await res.json();
      msg = j.message || j.error || msg;
    } catch {
      /* ignore */
    }
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  const blob = await res.blob();
  const cd = res.headers.get("Content-Disposition") || "";
  const m = cd.match(/filename="?([^";]+)"?/i);
  const name = m?.[1] || "attachment";
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
