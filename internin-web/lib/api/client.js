// Client HTTP unique pour toute l'application. Centralise :
// - l'URL de base de l'API
// - l'ajout automatique du token JWT
// - le refresh automatique du token en cas de 401 (via cookie HttpOnly)
// - la gestion d'erreurs uniforme

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

let refreshPromise = null;

async function tryRefreshAccessToken() {
  // Déduplique les appels refresh parallèles
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const { useAuthStore } = await import("@/lib/store/useAuthStore");
      const { refreshTokenRequest } = await import("@/lib/api/auth");

      // Le refresh token est lu côté serveur depuis le cookie HttpOnly.
      // On n'envoie plus le token dans le body.
      const data = await refreshTokenRequest();
      const newToken = data.token || data.accessToken;
      if (!newToken) return null;

      useAuthStore.getState().setAccessToken(newToken);
      return newToken;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiFetch(
  path,
  { method = "GET", body, token, _retried = false } = {},
) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include", // indispensable pour envoyer le cookie refresh HttpOnly
  });

  // Token expiré → tenter un refresh une seule fois (sauf sur la route refresh elle-même)
  if (
    response.status === 401 &&
    token &&
    !_retried &&
    !path.includes("/auth/refresh")
  ) {
    const newToken = await tryRefreshAccessToken();
    if (newToken) {
      return apiFetch(path, { method, body, token: newToken, _retried: true });
    }
    // Refresh impossible → déconnexion propre
    try {
      const { useAuthStore } = await import("@/lib/store/useAuthStore");
      useAuthStore.getState().clearSession();
    } catch {
      // ignore
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.error || "Une erreur est survenue";
    const err = new Error(message);
    err.status = response.status;
    throw err;
  }

  return data;
}
