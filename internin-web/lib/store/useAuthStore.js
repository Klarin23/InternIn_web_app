import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { setCookie, deleteCookie } from "@/lib/utils/cookies";

/**
 * Store d'authentification.
 *
 * Access token  → mémoire JS (+ cookie non-HttpOnly legacy pour SSR/navigation)
 * Refresh token → cookie HttpOnly uniquement (géré par le backend)
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
        if (token) setCookie("internin_token", token);
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
        if (token) setCookie("internin_token", token);
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
      // Ne jamais persister le refresh token
      partialize: (state) => ({
        user: state.user,
        token: state.token,
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
