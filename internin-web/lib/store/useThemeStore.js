// Store du thème clair/sombre. Même pattern que useAuthStore (persist en
// localStorage pour survivre à un rafraîchissement).
//
// Le script bloquant dans app/layout.js applique la classe "dark" sur <html>
// AVANT l'hydratation React (évite le flash du mauvais thème au chargement) ;
// ce store ne fait ensuite que garder React et le DOM synchronisés pour la
// suite de la session (clic sur le bouton, etc.).

import { create } from "zustand";
import { persist } from "zustand/middleware";

function appliquerClasseDark(theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: "light",

      toggleTheme: () => {
        const suivant = get().theme === "dark" ? "light" : "dark";
        appliquerClasseDark(suivant);
        set({ theme: suivant });
      },

      setTheme: (theme) => {
        appliquerClasseDark(theme);
        set({ theme });
      },
    }),
    { name: "internin-theme" },
  ),
);