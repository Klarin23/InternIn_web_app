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
  // Certains appels historiques (notamment les hooks de lecture des états
  // vus/non-vus) n'envoient pas explicitement le token. Depuis que le token
  // n'est plus persisté dans localStorage, cela provoquait un 401 alors que
  // la session était bien active.
  //
  // On récupère donc le token courant du store en navigateur lorsqu'aucun
  // token n'a été fourni explicitement. Cela ne change rien aux routes
  // publiques : sans session, aucun header Authorization n'est ajouté.
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

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    credentials: "include", // indispensable pour envoyer le cookie refresh HttpOnly
  });

  // Token expiré → tenter un refresh une seule fois (sauf sur la route refresh elle-même)
  if (
    response.status === 401 &&
    accessToken &&
    !_retried &&
    !path.includes("/auth/refresh")
  ) {
    const newToken = await tryRefreshAccessToken();
    if (newToken) {
      return apiFetch(path, {
        method,
        body,
        token: newToken,
        _retried: true,
      });
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
    let message = data.error || "Une erreur est survenue";
    // Zod fieldErrors → message lisible pour l'utilisateur
    if (data.details && typeof data.details === "object") {
      const parts = [];
      for (const [field, msgs] of Object.entries(data.details)) {
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
      // Signal global pour l'UI (évite d'importer React ici)
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
}
