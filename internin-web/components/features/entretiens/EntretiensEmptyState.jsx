"use client";
// État vide de la page entretiens, avec deux variantes selon que
// l'étudiant a ou non des candidatures en cours (donnée réelle passée en
// prop depuis la page, pas de logique inventée ici).

import Link from "next/link";
import { motion } from "framer-motion";
import { FiCalendar } from "react-icons/fi";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function EntretiensEmptyState({ aDesCandidatures }) {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center justify-center rounded-md border border-dashed border-border py-16 text-center"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <FiCalendar className="h-6 w-6 text-muted-foreground" />
      </div>

      <h3 className="text-sm font-bold text-foreground">
        {t("interviews.empty.title")}
      </h3>

      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        {aDesCandidatures
          ? t("interviews.empty.withApplications")
          : t("interviews.empty.withoutApplications")}
      </p>

      <Link
        href="/candidatures"
        className="mt-4 rounded-sm bg-[#14b8a6] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0d9488]"
      >
        {aDesCandidatures
          ? t("interviews.empty.viewApplications")
          : t("interviews.empty.exploreApplications")}
      </Link>
    </motion.div>
  );
}
