"use client";
// Citation motivante qui change chaque jour (index basé sur le jour de
// l'année, stable toute la journée, différent le lendemain). Fondu simple
// à l'apparition — pas besoin de plus pour un élément aussi discret.

import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";

function getCitationDuJour(citations) {
  const jourDeLAnnee = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86_400_000,
  );
  return citations[jourDeLAnnee % citations.length];
}

export default function CitationDuJour() {
  const { t } = useTranslation();
  const citations = t("dashboard.quoteOfDay.quotes");
  const citation = getCitationDuJour(citations);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
      className="flex items-center gap-3 rounded-[20px] border border-border bg-linear-to-r from-primary/[0.06] via-transparent to-secondary-foreground/[0.05] px-5 py-4"
    >
      <Quote className="h-5 w-5 shrink-0 text-primary" />
      <p className="text-sm font-medium italic text-foreground">{citation}</p>
    </motion.div>
  );
}
