"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Briefcase } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function PropositionsHero({ pendingCount = 0 }) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();

  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.35 }}
      className="rounded-2xl border border-border bg-card p-5 sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            <Briefcase className="h-3.5 w-3.5" aria-hidden />
            {t("stagiaireSpace.propositions.directOpps")}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {t("stagiaireSpace.propositions.title")}
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t("stagiaireSpace.propositions.heroDesc")}
          </p>
        </div>

        {pendingCount > 0 && (
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: reduce ? 0 : 0.15, duration: reduce ? 0 : 0.3 }}
            className="shrink-0 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-center sm:min-w-[140px]"
          >
            <p className="text-2xl font-semibold tabular-nums text-primary">
              {pendingCount}
            </p>
            <p className="text-xs font-medium text-muted-foreground">
              {t("stagiaireSpace.propositions.toHandle")}
            </p>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}
