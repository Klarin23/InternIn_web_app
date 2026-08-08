"use client";

import { motion } from "framer-motion";
import { FiInbox } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function OffresEmptyState({ onReset, hasFiltres }) {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border bg-card/40 py-20 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <FiInbox className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-semibold text-foreground">
        {t("offersPage.empty.title")}
      </p>
      <p className="max-w-xs text-xs text-muted-foreground">
        {hasFiltres
          ? t("offersPage.empty.filtered")
          : t("offersPage.empty.none")}
      </p>
      {hasFiltres && (
        <Button variant="outline" size="sm" className="mt-1" onClick={onReset}>
          {t("offersPage.empty.resetFilters")}
        </Button>
      )}
    </motion.div>
  );
}
