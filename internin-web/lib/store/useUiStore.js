// Store d'état d'interface global (pas de persistance : purement transitoire).
// Piloté depuis AppHeader (bouton burger) et lu depuis AppSidebar (affichage
// du tiroir mobile), sans prop drilling entre les deux.

import { create } from "zustand";

export const useUiStore = create((set) => ({
  mobileNavOpen: false,
  toggleMobileNav: () => set((state) => ({ mobileNavOpen: !state.mobileNavOpen })),
  closeMobileNav: () => set({ mobileNavOpen: false }),
}));