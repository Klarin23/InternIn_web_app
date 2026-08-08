"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FiSearch, FiArrowLeft } from "react-icons/fi";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function OffreNotFound() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border bg-card/40 py-20 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <FiSearch className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-semibold text-foreground">
        {t("offersPage.notFound.title")}
      </p>
      <p className="max-w-xs text-xs text-muted-foreground">
        {t("offersPage.notFound.description")}
      </p>
      <button
        type="button"
        onClick={() => router.push("/offres")}
        className="mt-1 flex items-center gap-1.5 rounded-sm border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
      >
        <FiArrowLeft className="h-4 w-4" />
        {t("offersPage.notFound.back")}
      </button>
    </motion.div>
  );
}
