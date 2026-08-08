"use client";
// Deux variantes d'état vide : aucune candidature du tout, ou aucun
// résultat pour la recherche/le filtre actif.

import Link from "next/link";
import { motion } from "framer-motion";
import { FiFileText, FiSearch } from "react-icons/fi";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function CandidaturesEmptyState({ variante, onReinitialiser }) {
  const { t } = useTranslation();
  const estFiltre = variante === "filtre";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center justify-center rounded-md border border-dashed border-border py-16 text-center"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        {estFiltre ? (
          <FiSearch className="h-6 w-6 text-muted-foreground" />
        ) : (
          <FiFileText className="h-6 w-6 text-muted-foreground" />
        )}
      </div>

      <h3 className="text-sm font-bold text-foreground">
        {estFiltre
          ? t("candidatures.empty.filteredTitle")
          : t("candidatures.empty.noneTitle")}
      </h3>

      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        {estFiltre
          ? t("candidatures.empty.filteredDesc")
          : t("candidatures.empty.noneDesc")}
      </p>

      {estFiltre ? (
        <button
          type="button"
          onClick={onReinitialiser}
          className="mt-4 rounded-sm bg-[#14b8a6] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0d9488]"
        >
          {t("candidatures.empty.resetButton")}
        </button>
      ) : (
        <Link
          href="/offres"
          className="mt-4 rounded-sm bg-[#14b8a6] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0d9488]"
        >
          {t("candidatures.empty.exploreButton")}
        </Link>
      )}
    </motion.div>
  );
}
