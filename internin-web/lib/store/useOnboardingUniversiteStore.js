import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useOnboardingUniversiteStore = create(
  persist(
    (set) => ({
      data: {},
      saveStepData: (stepData) =>
        set((state) => ({ data: { ...state.data, ...stepData } })),
      resetOnboarding: () => set({ data: {} }),
    }),
    {
      name: "internin-onboarding-universite",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
