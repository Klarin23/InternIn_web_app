// Client HTTP unique pour toute l'application. Centralise :
// - l'URL de base de l'API
// - l'ajout automatique du token JWT (depuis le store si non fourni)
// - le refresh automatique du token en cas de 401 (via cookie HttpOnly)
// - la gestion d'erreurs uniforme
//
// IMPORTANT : ne JAMAIS appeler clearSession sur un 403 (compte inactif,
// rôle insuffisant, entreprise non vérifiée, etc.). Uniquement après
// échec réel du refresh d'authentification.

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

let refreshPromise = null;

/** Récupère le token en mémoire (Zustand), sans le persister. */
async function getStoreToken() {
  try {
    const { useAuthStore } = await import("@/lib/store/useAuthStore");
    return useAuthStore.getState().token || null;
  } catch {
    return null;
  }
}

async function tryRefreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const { useAuthStore } = await import("@/lib/store/useAuthStore");
      const { refreshTokenRequest } = await import("@/lib/api/auth");

      const data = await refreshTokenRequest();
      const newToken = data.token || data.accessToken;
      if (!newToken) return null;

      if (data.user) {
        useAuthStore.getState().setSession(data.user, newToken);
      } else {
        useAuthStore.getState().setAccessToken(newToken);
      }
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
  // Si l'appelant n'a pas passé le token, on le prend dans le store.
  // Évite les déconnexions quand un bouton oublie de transmettre `token`.
  const resolvedToken = token || (await getStoreToken());

  const headers = { "Content-Type": "application/json" };
  if (resolvedToken) {
    headers.Authorization = `Bearer ${resolvedToken}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  // 401 → tenter un refresh une seule fois (cookie HttpOnly)
  const isAuthRoute =
    path.includes("/auth/refresh") ||
    path.includes("/auth/login") ||
    path.includes("/auth/register") ||
    path.includes("/auth/google");

  if (response.status === 401 && !_retried && !isAuthRoute) {
    const newToken = await tryRefreshAccessToken();
    if (newToken) {
      return apiFetch(path, {
        method,
        body,
        token: newToken,
        _retried: true,
      });
    }

    // Refresh impossible → vraie fin de session
    try {
      const { useAuthStore } = await import("@/lib/store/useAuthStore");
      useAuthStore.getState().clearSession();
    } catch {
      // ignore
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.error || data.message || "Une erreur est survenue";
    const err = new Error(message);
    err.status = response.status;
    err.code = data.code;
    err.data = data;
    throw err;
  }

  return data;
}
