// Client HTTP unique pour toute l'application. Centralise :
// - l'URL de base de l'API (via la variable d'environnement)
// - l'ajout automatique du token JWT dans l'en-tête Authorization
// - la gestion d'erreurs uniforme (lève une Error lisible côté formulaire)

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function apiFetch(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include", // important pour envoyer le cookie HttpOnly
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Le backend renvoie { error: "message" } ou { error, details } (Zod)
    const message = data.error || "Une erreur est survenue";
    throw new Error(message);
  }

  return data;
}
