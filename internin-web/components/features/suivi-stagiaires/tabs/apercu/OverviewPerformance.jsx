"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  formatNote,
  getAppreciationKey,
  progressionEvaluations,
} from "./apercuUtils";

export default function OverviewPerformance({ moyenne, evaluations }) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const appreciationKey = getAppreciationKey(moyenne);
  const appreciation = appreciationKey ? t(appreciationKey) : null;
  const evolution = progressionEvaluations(evaluations);

  if (moyenne == null && (!evaluations || evaluations.length === 0)) {
    return (
      <motion.section
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.3 }}
        className="rounded-2xl border border-dashed border-border/80 bg-card/50 p-5"
      >
        <h4 className="text-sm font-semibold text-foreground">
          {t("suivi.overview.globalPerf")}
        </h4>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("suivi.overview.noPerfData")}
        </p>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.3,
        delay: reduceMotion ? 0 : 0.06,
      }}
      className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm"
    >
      <h4 className="text-sm font-semibold text-foreground">
        {t("suivi.overview.globalPerf")}
      </h4>
      <p className="mt-1 text-xs text-muted-foreground">
        {t("suivi.overview.basedOnLast")}
      </p>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <p className="text-3xl font-bold tabular-nums tracking-tight text-foreground">
          {moyenne != null ? formatNote(moyenne) : "—"}
          <span className="text-base font-medium text-muted-foreground">
            {" "}
            / 5
          </span>
        </p>
        {appreciation && (
          <span className="mb-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {appreciation}
          </span>
        )}
      </div>
      {evolution != null && (
        <p className="mt-2 text-xs text-muted-foreground">
          {evolution >= 0 ? "+" : ""}
          {evolution.toFixed(0)} % {t("suivi.overview.sinceFirst")}
        </p>
      )}
    </motion.section>
  );
}
