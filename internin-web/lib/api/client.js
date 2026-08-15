// Client HTTP unique pour toute l'application.
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

let refreshPromise = null;

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
    } catch (err) {
      // Uniquement si le serveur dit "session morte" (401/403 sur /refresh)
      // on déconnecte. Une erreur réseau ne doit PAS vider la session.
      if (err?.status === 401 || err?.status === 403) {
        try {
          const { useAuthStore } = await import("@/lib/store/useAuthStore");
          useAuthStore.getState().clearSession();
        } catch {
          /* ignore */
        }
      }
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
    // Ne PAS clearSession ici : déjà géré dans tryRefreshAccessToken
    // si le refresh a vraiment répondu 401. Évite de déconnecter sur
    // un simple endpoint métier qui renvoie 401 à tort.
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
