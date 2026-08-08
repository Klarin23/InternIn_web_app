"use client";

import { motion } from "framer-motion";
import { FiGrid, FiList } from "react-icons/fi";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function OffresViewToggle({ vue, onChange }) {
  const { t } = useTranslation();
  return (
    <div className="relative flex items-center gap-1 rounded-sm border border-border bg-background p-1">
      <button
        type="button"
        onClick={() => onChange("grille")}
        title={t("offersPage.viewToggle.grid")}
        aria-label={t("offersPage.viewToggle.grid")}
        aria-pressed={vue === "grille"}
        className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-sm transition-colors ${
          vue === "grille"
            ? "text-primary-foreground"
            : "text-muted-foreground hover:bg-muted"
        }`}
      >
        {vue === "grille" && (
          <motion.span
            layoutId="offres-vue-toggle-indicateur"
            transition={{ type: "spring", stiffness: 500, damping: 32 }}
            className="absolute inset-0 -z-10 rounded-sm bg-primary"
          />
        )}
        <FiGrid className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange("liste")}
        title={t("offersPage.viewToggle.list")}
        aria-label={t("offersPage.viewToggle.list")}
        aria-pressed={vue === "liste"}
        className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-sm transition-colors ${
          vue === "liste"
            ? "text-primary-foreground"
            : "text-muted-foreground hover:bg-muted"
        }`}
      >
        {vue === "liste" && (
          <motion.span
            layoutId="offres-vue-toggle-indicateur"
            transition={{ type: "spring", stiffness: 500, damping: 32 }}
            className="absolute inset-0 -z-10 rounded-sm bg-primary"
          />
        )}
        <FiList className="h-4 w-4" />
      </button>
    </div>
  );
}
