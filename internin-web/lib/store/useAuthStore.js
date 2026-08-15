import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Store d'authentification.
 *
 * Access token  → mémoire JavaScript uniquement (JAMAIS localStorage/cookie JS).
 * Refresh token → cookie HttpOnly géré exclusivement par l'API.
 *
 * Le store persiste uniquement les informations non secrètes de l'utilisateur.
 * Après un rechargement, useAuthReady() récupère un nouvel access token via
 * /auth/refresh en utilisant le cookie HttpOnly.
 */
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      _hasHydrated: false,

      setHasHydrated: (value) => set({ _hasHydrated: !!value }),

      setSession: (user, token) => {
        set({ user, token: token || null });
      },

      updateUser: (partial) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : state.user,
        }));
      },

      clearSession: () => {
        set({ user: null, token: null });
      },

      setAccessToken: (token) => {
        set({ token: token || null });
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
      // IMPORTANT : aucun secret ne doit être persisté.
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
