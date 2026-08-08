// Même logique que useOnboardingStore (stagiaire), mais store dédié pour
// ne jamais mélanger les données des deux parcours d'onboarding.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useOnboardingEntrepriseStore = create(
  persist(
    (set) => ({
      data: {},
      saveStepData: (stepData) =>
        set((state) => ({ data: { ...state.data, ...stepData } })),
      resetOnboarding: () => set({ data: {} }),
    }),
    {
      name: "internin-onboarding-entreprise",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
