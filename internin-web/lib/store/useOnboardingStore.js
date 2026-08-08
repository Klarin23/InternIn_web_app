// Store de progression de l'onboarding. Contrairement à useAuthStore
// (persist en localStorage, survit à la fermeture du navigateur),
// celui-ci utilise sessionStorage : la progression ne doit survivre
// qu'à un rafraîchissement de page, pas indéfiniment sur l'appareil.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const TOTAL_STEPS = 11;

export const useOnboardingStore = create(
  persist(
    (set, get) => ({
      // Toutes les données saisies, fusionnées étape après étape
      data: {},

      // Enregistre les données d'une étape et fusionne avec l'existant
      saveStepData: (stepData) => {
        set((state) => ({ data: { ...state.data, ...stepData } }));
      },

      // Réinitialise tout (utilisé après soumission finale réussie)
      resetOnboarding: () => set({ data: {} }),

      totalSteps: TOTAL_STEPS,
    }),
    {
      name: "internin-onboarding",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
