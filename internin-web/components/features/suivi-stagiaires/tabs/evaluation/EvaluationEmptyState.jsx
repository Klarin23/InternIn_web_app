"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
import { motion, useReducedMotion } from "framer-motion";
import { ClipboardList } from "lucide-react";

export default function EvaluationEmptyState({ action }) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.35 }}
      className="flex flex-col items-center rounded-2xl border border-dashed border-border/80 bg-card/50 px-6 py-14 text-center"
    >
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <ClipboardList className="size-7" strokeWidth={1.5} aria-hidden />
      </div>
      <h3 className="mt-5 text-base font-semibold text-foreground">
        {t("suivi.eval.empty")}
      </h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {t("suivi.eval.emptyHint")}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </motion.div>
  );
}
