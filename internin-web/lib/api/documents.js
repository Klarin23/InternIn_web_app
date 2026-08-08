// Upload de fichiers : cas particulier du client API, car il envoie du
// FormData (pas du JSON) — on ne réutilise donc pas apiFetch ici.

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

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