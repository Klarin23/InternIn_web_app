"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
import { motion, useReducedMotion } from "framer-motion";
import {
  Star,
  ClipboardCheck,
  TrendingUp,
  CalendarClock,
} from "lucide-react";
import {
  formatNote,
  getAppreciationKey,
  resolveRelativeDate,
} from "./evaluationUtils";

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

function KpiCard({ icon: Icon, label, value, hint, accent }) {
  return (
    <motion.div
      variants={item}
      className="group rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition-shadow duration-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className={`flex size-9 items-center justify-center rounded-xl ${accent || "bg-primary/10 text-primary"}`}
        >
          <Icon className="size-4" strokeWidth={1.75} aria-hidden />
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-0.5 text-xs font-medium text-muted-foreground">{label}</p>
      {hint ? (
        <p className="mt-1.5 text-[11px] text-muted-foreground/90">{hint}</p>
      ) : null}
    </motion.div>
  );
}

export default function EvaluationStats({
  moyenne,
  count,
  progression,
  lastRelative,
}) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const appreciationKey = getAppreciationKey(moyenne);
  const appreciation = appreciationKey ? t(appreciationKey) : null;
  const lastRelLabel = resolveRelativeDate(lastRelative, t);

  const progressionLabel =
    progression == null
      ? t("suivi.eval.insufficientData")
      : `${progression >= 0 ? "+" : ""}${progression.toFixed(0)} %`;

  const countHint =
    count === 0
      ? t("suivi.eval.noneDone")
      : count === 1
        ? t("suivi.eval.doneOne", { count })
        : t("suivi.eval.doneOther", { count });

  return (
    <motion.div
      className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      variants={reduceMotion ? undefined : container}
      initial={reduceMotion ? false : "hidden"}
      animate={reduceMotion ? undefined : "show"}
    >
      <KpiCard
        icon={Star}
        label={t("suivi.eval.avgGeneral")}
        value={moyenne != null ? `${formatNote(moyenne)} / 5` : "—"}
        hint={appreciation || t("suivi.eval.noGrade")}
        accent="bg-amber-500/10 text-amber-600 dark:text-amber-400"
      />
      <KpiCard
        icon={ClipboardCheck}
        label={t("suivi.eval.evaluation")}
        value={String(count)}
        hint={countHint}
        accent="bg-primary/10 text-primary"
      />
      <KpiCard
        icon={TrendingUp}
        label={t("suivi.eval.progression")}
        value={progression == null ? "—" : progressionLabel}
        hint={t("suivi.eval.sinceFirst")}
        accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      />
      <KpiCard
        icon={CalendarClock}
        label={t("suivi.eval.lastEval")}
        value={lastRelLabel || "—"}
        hint={
          lastRelLabel
            ? t("suivi.eval.lastVsToday")
            : t("suivi.eval.notSubmitted")
        }
        accent="bg-sky-500/10 text-sky-600 dark:text-sky-400"
      />
    </motion.div>
  );
}
