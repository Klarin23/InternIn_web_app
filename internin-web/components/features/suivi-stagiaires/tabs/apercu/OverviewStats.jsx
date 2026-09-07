"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Percent,
  Star,
  ClipboardCheck,
  CalendarClock,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { formatNote, getAppreciationKey } from "./apercuUtils";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28 } },
};

function Kpi({ icon: Icon, value, label, hint, accent }) {
  return (
    <motion.div
      variants={item}
      className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition-shadow duration-200 hover:shadow-md"
    >
      <div
        className={`flex size-9 items-center justify-center rounded-xl ${accent}`}
      >
        <Icon className="size-4" strokeWidth={1.75} aria-hidden />
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight tabular-nums text-foreground">
        {value}
      </p>
      <p className="mt-0.5 text-xs font-medium text-muted-foreground">{label}</p>
      {hint ? (
        <p className="mt-1 text-[11px] text-muted-foreground/90">{hint}</p>
      ) : null}
    </motion.div>
  );
}

export default function OverviewStats({
  avancement,
  moyenne,
  evalCount,
  joursRestants,
  stageTermine,
}) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const appreciationKey = getAppreciationKey(moyenne);
  const appreciation = appreciationKey ? t(appreciationKey) : null;
  const count = evalCount ?? 0;

  let tempsValue = "—";
  let tempsHint = t("suivi.overview.notCalculable");
  if (stageTermine) {
    tempsValue = "0 j";
    tempsHint = t("suivi.overview.stageEnded");
  } else if (typeof joursRestants === "number") {
    if (joursRestants < 0) {
      tempsValue = "—";
      tempsHint = t("suivi.overview.endPassed");
    } else {
      tempsValue = `${joursRestants} j`;
      tempsHint = t("suivi.overview.untilEnd");
    }
  }

  const evalHint =
    count === 0
      ? t("suivi.overview.noneDone")
      : count === 1
        ? t("suivi.overview.doneOne", { count })
        : t("suivi.overview.doneOther", { count });

  return (
    <motion.div
      className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      variants={reduceMotion ? undefined : container}
      initial={reduceMotion ? false : "hidden"}
      animate={reduceMotion ? undefined : "show"}
    >
      <Kpi
        icon={Percent}
        value={`${avancement ?? 0} %`}
        label={t("suivi.overview.progression")}
        hint={t("suivi.overview.ofStage")}
        accent="bg-primary/10 text-primary"
      />
      <Kpi
        icon={Star}
        value={moyenne != null ? `${formatNote(moyenne)} / 5` : "—"}
        label={t("suivi.overview.performance")}
        hint={appreciation || t("suivi.overview.noEval")}
        accent="bg-amber-500/10 text-amber-600 dark:text-amber-400"
      />
      <Kpi
        icon={ClipboardCheck}
        value={String(count)}
        label={t("suivi.overview.evaluations")}
        hint={evalHint}
        accent="bg-sky-500/10 text-sky-600 dark:text-sky-400"
      />
      <Kpi
        icon={CalendarClock}
        value={tempsValue}
        label={t("suivi.overview.timeLeft")}
        hint={tempsHint}
        accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      />
    </motion.div>
  );
}
