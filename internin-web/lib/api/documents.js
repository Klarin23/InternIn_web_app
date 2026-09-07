// Upload de fichiers : cas particulier du client API, car il envoie du
// FormData (pas du JSON) — on ne réutilise donc pas apiFetch ici.
//
// Étape 2/4 : passe par le proxy Next.js ("/api/...") comme apiFetch,
// au lieu de l'URL Railway en direct — voir lib/api/client.js.
const API_URL = "/api";

export async function uploadDocumentRequest(file, type, token) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/documents/upload/${type}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }, // pas de Content-Type : le navigateur le gère lui-même avec la bonne boundary
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Échec de l'envoi du fichier");
  }

  return data;
}