import { create } from "zustand";
import { persist } from "zustand/middleware";

export const LOCALES_DISPONIBLES = ["fr", "en"];
export const LOCALE_PAR_DEFAUT = "fr";

function appliquerLangDocument(locale) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = locale;
}

export const useI18nStore = create(
  persist(
    (set, get) => ({
      locale: LOCALE_PAR_DEFAUT,

      setLocale: (locale) => {
        if (!LOCALES_DISPONIBLES.includes(locale)) return;
        if (get().locale === locale) return;
        appliquerLangDocument(locale);
        set({ locale });
      },
    }),
    { name: "internin-locale" },
  ),
);
