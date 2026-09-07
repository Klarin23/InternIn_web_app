"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
import { motion, useReducedMotion } from "framer-motion";
import {
  formatNote,
  getAppreciationKey,
  moyenneEvaluation,
} from "./evaluationUtils";

export default function EvaluationSummary({ moyenne, evaluations }) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const appreciationKey = getAppreciationKey(moyenne);
  const appreciation = appreciationKey ? t(appreciationKey) : null;
  const pct =
    moyenne != null ? Math.min(100, Math.max(0, (moyenne / 5) * 100)) : 0;

  let delta = null;
  if (evaluations && evaluations.length >= 2) {
    const sorted = [...evaluations].sort(
      (a, b) => (a.numeroSemaine || 0) - (b.numeroSemaine || 0),
    );
    const prev = moyenneEvaluation(sorted[sorted.length - 2]);
    const last = moyenneEvaluation(sorted[sorted.length - 1]);
    if (prev != null && last != null) {
      delta = last - prev;
    }
  }

  const r = 54;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.35,
        delay: reduceMotion ? 0 : 0.1,
      }}
      className="flex flex-col items-center justify-center rounded-2xl border border-border/70 bg-card p-5 shadow-sm"
    >
      <h4 className="self-start text-sm font-semibold text-foreground">
        {t("suivi.eval.summary")}
      </h4>
      <p className="mt-1 self-start text-xs text-muted-foreground">
        {t("suivi.eval.summaryHint")}
      </p>

      <div className="relative mt-6 flex size-36 items-center justify-center">
        <svg
          className="-rotate-90"
          width="144"
          height="144"
          viewBox="0 0 144 144"
          aria-hidden
        >
          <circle
            cx="72"
            cy="72"
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className="text-muted"
          />
          <circle
            cx="72"
            cy="72"
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            className="text-primary transition-[stroke-dashoffset] duration-700 ease-out"
            style={{
              strokeDashoffset: offset,
              transitionDuration: reduceMotion ? "0ms" : "800ms",
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular-nums text-foreground">
            {moyenne != null ? formatNote(moyenne) : "—"}
          </span>
          <span className="text-[11px] font-medium text-muted-foreground">
            / 5
          </span>
        </div>
      </div>

      <p className="mt-4 text-sm font-semibold text-foreground">
        {appreciation || t("suivi.eval.noAverageYet")}
      </p>
      {delta != null && (
        <p className="mt-1 text-xs text-muted-foreground">
          {delta >= 0 ? "+" : ""}
          {formatNote(delta)} {t("suivi.eval.vsPrevious")}
        </p>
      )}
    </motion.section>
  );
}
