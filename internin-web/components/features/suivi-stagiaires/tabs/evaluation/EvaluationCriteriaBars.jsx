"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { motion, useReducedMotion } from "framer-motion";
import { CRITERES, formatNote } from "./evaluationUtils";

function CriterionRow({ label, value, animate }) {
  const reduceMotion = useReducedMotion();
  const target = value != null ? (value / 5) * 100 : 0;
  const skipAnim = reduceMotion || !animate;
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (skipAnim) return;
    let cancelled = false;
    const id = requestAnimationFrame(() => {
      if (!cancelled) setWidth(target);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [target, skipAnim]);

  const displayWidth = skipAnim ? target : width;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="tabular-nums text-xs font-semibold text-muted-foreground">
          {value != null ? `${formatNote(value)} / 5` : "—"}
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={value != null ? Number(value.toFixed(1)) : 0}
        aria-valuemin={0}
        aria-valuemax={5}
        aria-label={label}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
          style={{
            width: `${displayWidth}%`,
            transitionDuration: reduceMotion ? "0ms" : "700ms",
          }}
        />
      </div>
    </div>
  );
}

export default function EvaluationCriteriaBars({ averages }) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.35,
        delay: reduceMotion ? 0 : 0.05,
      }}
      className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm"
    >
      <h4 className="text-sm font-semibold text-foreground">
        {t("suivi.eval.perfBySkill")}
      </h4>
      <p className="mt-1 text-xs text-muted-foreground">
        {t("suivi.eval.averagesHint")}
      </p>
      <div className="mt-5 space-y-4">
        {CRITERES.map(({ key, labelKey }) => {
          const label = t(labelKey);
          return (
            <CriterionRow
              key={key}
              label={label}
              value={averages?.[key] ?? null}
              animate
            />
          );
        })}
      </div>
    </motion.section>
  );
}
