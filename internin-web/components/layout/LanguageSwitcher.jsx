"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiCheck, FiChevronDown } from "react-icons/fi";
import { useTranslation } from "@/lib/i18n/useTranslation";

const LANGUES = [
  { code: "fr", drapeau: "🇫🇷", labelCle: "languageSwitcher.french" },
  { code: "en", drapeau: "🇬🇧", labelCle: "languageSwitcher.english" },
];

export default function LanguageSwitcher({ align = "right" }) {
  const { t, locale, setLocale } = useTranslation();
  const [ouvert, setOuvert] = useState(false);

  const langueCourante = LANGUES.find((l) => l.code === locale) || LANGUES[0];

  function choisirLangue(code) {
    setLocale(code);
    setOuvert(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        aria-label={t("languageSwitcher.selectLanguage")}
        aria-expanded={ouvert}
        className="flex h-9 items-center gap-1.5 rounded-full px-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted"
      >
        <span aria-hidden="true">🌐</span>
        <span className="uppercase">{langueCourante.code}</span>
        <motion.span
          animate={{ rotate: ouvert ? 180 : 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="flex items-center"
        >
          <FiChevronDown className="h-3.5 w-3.5" />
        </motion.span>
      </button>

      <AnimatePresence>
        {ouvert && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOuvert(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className={`absolute z-20 mt-2 w-44 overflow-hidden rounded-md border border-border bg-card py-1.5 shadow-md ${
                align === "right" ? "right-0" : "left-0"
              }`}
            >
              {LANGUES.map((langue) => {
                const estActive = langue.code === locale;
                return (
                  <button
                    key={langue.code}
                    type="button"
                    onClick={() => choisirLangue(langue.code)}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-foreground transition hover:bg-muted"
                  >
                    <span aria-hidden="true" className="text-base">
                      {langue.drapeau}
                    </span>
                    <span className="flex-1">{t(langue.labelCle)}</span>
                    {estActive && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.15 }}
                        className="flex items-center text-primary"
                      >
                        <FiCheck className="h-4 w-4" />
                      </motion.span>
                    )}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
