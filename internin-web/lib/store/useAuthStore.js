import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { setCookie, deleteCookie } from "@/lib/utils/cookies";

// Doit rester aligné avec ACCESS_TOKEN_EXPIRES_IN côté API (15 minutes par
// défaut, cf. internin-api/src/utils/jwt.js). Le cookie "internin_token"
// n'a de toute façon aucune utilité passé ce délai : le middleware vérifie
// la signature ET l'expiration du JWT lui-même, donc un cookie plus long
// ne changerait rien pour l'auth — autant éviter qu'une copie du token
// traîne inutilement dans le navigateur au-delà de sa durée de vie réelle.
const ACCESS_TOKEN_COOKIE_MAX_AGE_SECONDS = 15 * 60;

/**
 * Store d'authentification.
 *
 * Access token  → mémoire JS UNIQUEMENT (+ cookie non-HttpOnly de courte
 *                 durée, requis par le middleware Next.js pour la
 *                 protection des pages par rôle — voir proxy.js). Le
 *                 token n'est plus persisté en localStorage : au
 *                 rechargement de page, useAuthReady() le regénère via
 *                 un rafraîchissement silencieux (cookie HttpOnly refresh).
 * Refresh token → cookie HttpOnly uniquement (géré par le backend), jamais
 *                 vu par le JS du navigateur.
 *
 * Le refresh token n'est JAMAIS stocké dans localStorage / sessionStorage /
 * Zustand persisté.
 */
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      _hasHydrated: false,

      setHasHydrated: (value) => set({ _hasHydrated: !!value }),

      setSession: (user, token) => {
        if (token)
          setCookie(
            "internin_token",
            token,
            undefined,
            ACCESS_TOKEN_COOKIE_MAX_AGE_SECONDS,
          );
        set({
          user,
          token,
        });
      },

      updateUser: (partial) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : state.user,
        }));
      },

      clearSession: () => {
        deleteCookie("internin_token");
        set({ user: null, token: null });
      },

      setAccessToken: (token) => {
        if (token)
          setCookie(
            "internin_token",
            token,
            undefined,
            ACCESS_TOKEN_COOKIE_MAX_AGE_SECONDS,
          );
        set({ token });
      },
    }),
    {
      name: "internin-auth",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
      // Ne jamais persister le token d'accès ni le refresh token — seul
      // "user" (aucune donnée secrète) est gardé pour savoir, au chargement,
      // si on doit tenter un rafraîchissement silencieux (voir useAuthReady).
      partialize: (state) => ({
        user: state.user,
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.warn("[auth] Échec de réhydratation de la session:", error);
        }
      },
    },
  ),
);

export function useAuthHydrated() {
  return useAuthStore((s) => s._hasHydrated);
}
