"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { refreshTokenRequest } from "@/lib/api/auth";

/**
 * Initialise la session sans jamais persister l'access token.
 * Au chargement, le refresh token HttpOnly permet d'obtenir un nouvel
 * access token en mémoire uniquement.
 *
 * Protections :
 * - Déduplication si React Strict Mode monte l'effet 2 fois
 * - Ne pas effacer l'utilisateur affiché en cas d'erreur réseau temporaire
 * - Uniquement clearSession si le serveur répond vraiment 401 (session morte)
 */

// Promise partagée au niveau module pour éviter 2 refresh parallèles
// (React Strict Mode en dev, ou plusieurs composants qui appellent le hook)
let sharedRefreshPromise = null;

function getSharedRefresh() {
  if (!sharedRefreshPromise) {
    sharedRefreshPromise = refreshTokenRequest().finally(() => {
      sharedRefreshPromise = null;
    });
  }
  return sharedRefreshPromise;
}

export function useAuthReady() {
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function initialiseSession() {
      try {
        if (!useAuthStore.persist.hasHydrated()) {
          await useAuthStore.persist.rehydrate?.();
        }

        // Toujours tenter le refresh : le cookie est HttpOnly et n'est donc
        // jamais exposé à JavaScript. Si aucune session n'existe, l'API répond 401.
        const data = await getSharedRefresh();
        if (cancelled) return;

        const token = data.token || data.accessToken;
        if (token && data.user) {
          useAuthStore.getState().setSession(data.user, token);
        } else if (token) {
          useAuthStore.getState().setAccessToken(token);
        }
      } catch (err) {
        if (cancelled) return;

        // 401 / 403 = vraiment plus de session → on nettoie tout
        const status = err?.status;
        if (status === 401 || status === 403) {
          useAuthStore.getState().clearSession();
        } else {
          // Erreur réseau / serveur : on retire seulement le token mémoire,
          // on garde l'utilisateur affiché (évite un "flash" déconnecté).
          useAuthStore.getState().setAccessToken(null);
        }
      } finally {
        if (!cancelled) {
          useAuthStore.getState().setHasHydrated(true);
          setReady(true);
        }
      }
    }

    initialiseSession();

    return () => {
      cancelled = true;
    };
  }, []);

  return ready || hasHydrated;
}
