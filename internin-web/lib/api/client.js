// Client HTTP unique pour toute l'application. Centralise :
// - l'URL de base de l'API
// - l'ajout automatique du token JWT
// - le refresh automatique du token en cas de 401 (via cookie HttpOnly)
// - la gestion d'erreurs uniforme

// Étape 2/4 — voir la conversation sur la sécurisation du token d'auth.
// On appelle désormais l'API via le proxy Next.js ("/api/...", même
// origine que le site) plutôt que l'URL Railway en direct. Ça permet au
// cookie HttpOnly posé par l'API de devenir un cookie "maison" du
// frontend (lisible par le middleware, jamais par le JS du navigateur),
// et ça évite au passage un souci de cookie cross-site (SameSite=Strict
// entre deux domaines différents Vercel/Railway).
const API_URL = "/api";

// Certains messages de validation renvoyés par l'API sont de simples clés
// i18n (ex: "validation.url.httpsRequired") plutôt que du texte déjà
// traduit. On les résout ici via la locale courante avant affichage.
async function traduireMessageValidation(msg) {
  if (typeof msg !== "string" || !msg.startsWith("validation.")) return msg;
  try {
    const { useI18nStore } = await import("@/lib/store/useI18nStore");
    const { translate } = await import("@/lib/i18n/useTranslation");
    const locale = useI18nStore.getState().locale;
    return translate(msg, locale);
  } catch {
    return msg;
  }
}

let refreshPromise = null;
let refreshRetryAfter = 0;

async function tryRefreshAccessToken() {
  // Déduplique les appels refresh parallèles et évite de marteler /auth/refresh
  // lorsque l'API vient temporairement de répondre 429.
  if (refreshPromise) return refreshPromise;
  if (Date.now() < refreshRetryAfter) {
    return { token: null, retryable: true };
  }

  refreshPromise = (async () => {
    try {
      const { useAuthStore } = await import("@/lib/store/useAuthStore");
      const { refreshTokenRequest } = await import("@/lib/api/auth");

      // Le refresh token est lu côté serveur depuis le cookie HttpOnly.
      // On n'envoie plus le token dans le body.
      const data = await refreshTokenRequest();
      const newToken = data.token || data.accessToken;
      if (!newToken) return { token: null, retryable: false };

      useAuthStore.getState().setAccessToken(newToken);
      return { token: newToken, retryable: false };
    } catch (error) {
      // Un 429 est un problème de quota, pas une session expirée.
      // Ne surtout pas déconnecter l'utilisateur dans ce cas.
      const retryable = error?.status === 429;
      if (retryable) {
        // Petite temporisation locale : le quota pourra ensuite être retenté
        // sans provoquer une nouvelle rafale de requêtes.
        refreshRetryAfter = Date.now() + 5000;
      }
      return {
        token: null,
        retryable,
      };
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
  // Certains appels historiques n'envoient pas explicitement le token.
  // On récupère donc le token courant du store lorsqu'il est disponible.
  let accessToken = token;
  if (!accessToken && typeof window !== "undefined") {
    try {
      const { useAuthStore } = await import("@/lib/store/useAuthStore");
      accessToken = useAuthStore.getState().token || null;
    } catch {
      accessToken = null;
    }
  }

  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const headers = {};
  if (!isForm) headers["Content-Type"] = "application/json";
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  // Le timeout couvre TOUTE la requête, y compris la lecture du body.
  // `fetch()` peut résoudre dès réception des headers : il ne faut donc pas
  // arrêter le timer immédiatement après `await fetch()`, sinon un proxy/API
  // qui garde le body ouvert peut laisser React Query en `pending` indéfiniment.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
      credentials: "include",
      signal: controller.signal,
    });

    // Token expiré → tenter un refresh une seule fois.
    if (
      response.status === 401 &&
      accessToken &&
      !_retried &&
      !path.includes("/auth/refresh")
    ) {
      const refreshResult = await tryRefreshAccessToken();
      if (refreshResult?.token) {
        return await apiFetch(path, {
          method,
          body,
          token: refreshResult.token,
          _retried: true,
        });
      }

      if (!refreshResult?.retryable) {
        try {
          const { useAuthStore } = await import("@/lib/store/useAuthStore");
          useAuthStore.getState().clearSession();
        } catch {
          // ignore
        }
      }
    }

    // La lecture du body reste sous le même AbortController/timeout.
    // Ne jamais avaler AbortError ici : sinon un body bloqué serait transformé
    // en `{}` et la mutation pourrait rester dans un état incohérent.
    let data = {};
    try {
      data = await response.json();
    } catch (error) {
      if (error?.name === "AbortError") throw error;
      data = {};
    }

    if (!response.ok) {
      let message = data.error || "Une erreur est survenue";
      if (data.details && typeof data.details === "object") {
        const parts = [];
        for (const [, msgs] of Object.entries(data.details)) {
          if (Array.isArray(msgs) && msgs.length) {
            parts.push(await traduireMessageValidation(msgs[0]));
          } else if (typeof msgs === "string") {
            parts.push(await traduireMessageValidation(msgs));
          }
        }
        if (parts.length) message = parts.join(" · ");
      }

      const err = new Error(message);
      err.status = response.status;
      err.code = data.code;
      err.details = data.details;
      if (data.code === "MAINTENANCE") {
        err.maintenance = data.maintenance || true;
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("internin:maintenance", {
              detail: { message, ...data.maintenance },
            }),
          );
        }
      }
      throw err;
    }

    return data;
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error(
        "La requête a dépassé le délai d'attente. Vérifiez votre connexion puis réessayez.",
      );
      timeoutError.code = "API_TIMEOUT";
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
