"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  formatDateShort,
  STATUT_CONFIG,
  getStatutAffichage,
} from "./apercuUtils";

export default function OverviewProgress({ stage, avancement, moyenne }) {
  const { t, locale } = useTranslation();
  const localeTag = locale === "en" ? "en-GB" : "fr-FR";
  const reduceMotion = useReducedMotion();
  const target = avancement ?? 0;
  const [width, setWidth] = useState(0);
  const statutKey = getStatutAffichage(stage, moyenne);
  const barClass = (STATUT_CONFIG[statutKey] || STATUT_CONFIG.en_cours).bar;

  useEffect(() => {
    if (reduceMotion) return;
    let cancelled = false;
    const id = requestAnimationFrame(() => {
      if (!cancelled) setWidth(target);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [target, reduceMotion]);

  const displayWidth = reduceMotion ? target : width;

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.3,
        delay: reduceMotion ? 0 : 0.04,
      }}
      className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-foreground">
          {t("suivi.stageProgress")}
        </h4>
        <span className="text-sm font-bold tabular-nums text-foreground">
          {target} %
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {formatDateShort(stage?.dateDebut, localeTag) ||
            t("suivi.overview.start")}
        </span>
        <span>
          {formatDateShort(stage?.dateFinPrevue, localeTag) ||
            t("suivi.overview.end")}
        </span>
      </div>

      <div
        className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={target}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t("suivi.stageProgress")}
      >
        <div
          className={`h-full rounded-full ${barClass}`}
          style={{
            width: `${displayWidth}%`,
            transition: reduceMotion ? "none" : "width 750ms ease-out",
          }}
        />
      </div>
    </motion.section>
  );
}
