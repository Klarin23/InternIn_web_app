"use client";

import { useI18nStore } from "@/lib/store/useI18nStore";
import fr from "./locales/fr.json";
import en from "./locales/en.json";

const DICTIONNAIRES = { fr, en };

function resoudreCle(dictionnaire, cle) {
  return cle
    .split(".")
    .reduce(
      (acc, segment) =>
        acc && typeof acc === "object" ? acc[segment] : undefined,
      dictionnaire,
    );
}

function interpoler(chaine, params) {
  if (!params) return chaine;
  return Object.entries(params).reduce(
    (acc, [key, value]) => acc.replaceAll(`{${key}}`, String(value)),
    chaine,
  );
}

export function useTranslation() {
  const locale = useI18nStore((state) => state.locale);
  const setLocale = useI18nStore((state) => state.setLocale);

  function t(cle, params) {
    const valeur =
      resoudreCle(DICTIONNAIRES[locale], cle) ??
      resoudreCle(DICTIONNAIRES.fr, cle) ??
      cle;
    return typeof valeur === "string" ? interpoler(valeur, params) : valeur;
  }

  return { t, locale, setLocale };
}
