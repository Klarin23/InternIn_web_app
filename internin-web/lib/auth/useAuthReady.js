"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";

/**
 * Attend que le store auth soit réhydraté depuis localStorage, PUIS, si
 * aucun token n'est en mémoire (cas normal désormais : le token n'est plus
 * persisté en localStorage — voir useAuthStore.js), tente un rafraîchissement
 * silencieux via le cookie HttpOnly "internin_refresh" avant de considérer
 * l'auth comme "prête".
 *
 * Empêche les redirections prématurées vers /connexion au rechargement (F5) :
 * avant, cette protection reposait sur le token brut stocké en localStorage ;
 * maintenant elle repose sur un vrai aller-retour réseau protégé par le
 * cookie HttpOnly (jamais lisible par du JS injecté).
 */
export function useAuthReady() {
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const [ready, setReady] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function afterHydration() {
      // Garde-fou : les 3 déclencheurs plus bas (déjà hydraté / événement
      // de fin d'hydratation / promesse de rehydrate) peuvent en théorie
      // se déclencher plus d'une fois — on ne veut exécuter la suite
      // (et surtout l'éventuel appel réseau de refresh) qu'une seule fois.
      if (startedRef.current) return;
      startedRef.current = true;

      const { token, user, clearSession, setSession } =
        useAuthStore.getState();

      // Token déjà en mémoire (ex: on vient de se connecter dans cet onglet,
      // pas besoin de F5) : rien à faire.
      if (token) {
        useAuthStore.getState().setHasHydrated(true);
        if (!cancelled) setReady(true);
        return;
      }

      // Pas de token en mémoire et pas d'utilisateur connu non plus :
      // visiteur non connecté, inutile d'appeler l'API pour rien.
      if (!user) {
        useAuthStore.getState().setHasHydrated(true);
        if (!cancelled) setReady(true);
        return;
      }

      // Un "user" était connu (persisté) mais pas de token en mémoire :
      // typiquement un rechargement de page. On tente un rafraîchissement
      // silencieux — le cookie HttpOnly "internin_refresh" est envoyé
      // automatiquement par le navigateur (credentials: include).
      //
      // Important : on ne marque "hasHydrated" qu'une fois ce refresh
      // résolu (succès ou échec) — sinon les layouts (qui redirigent vers
      // /connexion dès que "hydrated" est vrai mais qu'il n'y a pas de
      // token) nous éjecteraient avant même la fin de l'appel réseau.
      try {
        const { refreshTokenRequest } = await import("@/lib/api/auth");
        const data = await refreshTokenRequest();
        if (cancelled) return;
        if (data?.token) {
          setSession(data.user || user, data.token);
        } else {
          clearSession();
        }
      } catch {
        // Refresh token absent/expiré (ex: 7 jours d'inactivité) → session
        // réellement terminée, on nettoie proprement.
        if (!cancelled) clearSession();
      } finally {
        if (!cancelled) {
          useAuthStore.getState().setHasHydrated(true);
          setReady(true);
        }
      }
    }

    // Déjà hydraté ?
    if (useAuthStore.persist.hasHydrated()) {
      afterHydration();
      return () => {
        cancelled = true;
      };
    }

    const unsub = useAuthStore.persist.onFinishHydration(() => {
      afterHydration();
    });

    // Force rehydrate si le middleware ne l'a pas encore fait
    try {
      const p = useAuthStore.persist.rehydrate?.();
      if (p && typeof p.then === "function") {
        p.then(afterHydration).catch(afterHydration);
      }
    } catch {
      // ignore
    }

    // Filet de sécurité : si rien n'a déclenché l'hydratation sous 500ms
    const timeout = setTimeout(() => {
      if (!useAuthStore.getState()._hasHydrated) {
        afterHydration();
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      if (typeof unsub === "function") unsub();
    };
  }, []);

  return ready || hasHydrated;
}
