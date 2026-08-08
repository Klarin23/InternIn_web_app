import { create } from "zustand";
import { persist } from "zustand/middleware";
import { setCookie, deleteCookie } from "@/lib/utils/cookies";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,

      setSession: (user, token, refreshToken = null) => {
        setCookie("internin_token", token);
        set({ user, token, refreshToken });
      },

      updateUser: (partial) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : state.user,
        }));
      },

      clearSession: () => {
        deleteCookie("internin_token");
        set({ user: null, token: null, refreshToken: null });
      },

      // Appelé quand l'access token expire
      setAccessToken: (token) => {
        setCookie("internin_token", token);
        set({ token });
      },
    }),
    { name: "internin-auth" },
  ),
);
