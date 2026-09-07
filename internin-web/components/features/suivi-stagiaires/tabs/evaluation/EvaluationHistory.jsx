"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
import { motion, useReducedMotion } from "framer-motion";
import { Star } from "lucide-react";
import {
  CRITERES,
  formatDate,
  formatNote,
  moyenneEvaluation,
  getAppreciationKey,
} from "./evaluationUtils";

function EvaluationCard({ evalu, index, isLatest }) {
  const { t, locale } = useTranslation();
  const reduceMotion = useReducedMotion();
  const moyenne = moyenneEvaluation(evalu);
  const appreciationKey = getAppreciationKey(moyenne);
  const dateLabel =
    formatDate(evalu.dateSoumission, locale) ||
    (evalu.numeroSemaine != null
      ? `${t("suivi.eval.week")} ${evalu.numeroSemaine}`
      : t("suivi.eval.evaluation"));

  const num = evalu.numeroSemaine ?? index + 1;
  const title =
    evalu.numeroSemaine != null
      ? `${t("suivi.eval.evaluation")} #${num} · ${t("suivi.eval.week")} ${evalu.numeroSemaine}`
      : `${t("suivi.eval.evaluation")} #${num}`;

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.3,
        delay: reduceMotion ? 0 : Math.min(index * 0.05, 0.25),
      }}
      className={`relative rounded-2xl border bg-card p-5 shadow-sm transition-shadow duration-200 hover:shadow-md ${
        isLatest
          ? "border-primary/40 ring-1 ring-primary/15"
          : "border-border/70"
      }`}
    >
      {isLatest && (
        <span className="absolute -top-2.5 right-4 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
          {t("suivi.eval.recent")}
        </span>
      )}

      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{dateLabel}</p>
          <h5 className="mt-0.5 text-sm font-semibold text-foreground">
            {title}
          </h5>
        </div>
        <div className="text-right">
          <p className="flex items-center justify-end gap-1 text-lg font-bold tabular-nums text-foreground">
            {moyenne != null ? formatNote(moyenne) : "—"}
            <span className="text-xs font-medium text-muted-foreground">
              / 5
            </span>
            <Star
              className="size-3.5 fill-amber-400 text-amber-400"
              aria-hidden
            />
          </p>
          <p className="text-[11px] font-medium text-muted-foreground">
            {appreciationKey
              ? t(appreciationKey)
              : t("suivi.eval.globalScore")}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {CRITERES.map(({ key, labelKey }) => (
          <div
            key={key}
            className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-2.5 py-2 text-xs"
          >
            <span className="truncate text-muted-foreground">
              {t(labelKey)}
            </span>
            <span className="shrink-0 font-semibold tabular-nums text-foreground">
              {evalu[key] != null ? evalu[key] : "—"}
            </span>
          </div>
        ))}
      </div>

      {evalu.commentaires ? (
        <div className="mt-4 rounded-xl bg-muted/40 px-3.5 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t("suivi.eval.comment")}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-foreground/90">
            {evalu.commentaires}
          </p>
        </div>
      ) : null}
    </motion.article>
  );
}

export default function EvaluationHistory({ evaluations }) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const sorted = [...(evaluations || [])].sort((a, b) => {
    const na = a.numeroSemaine || 0;
    const nb = b.numeroSemaine || 0;
    if (nb !== na) return nb - na;
    const da = a.dateSoumission ? new Date(a.dateSoumission).getTime() : 0;
    const db = b.dateSoumission ? new Date(b.dateSoumission).getTime() : 0;
    return db - da;
  });

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.35,
        delay: reduceMotion ? 0 : 0.12,
      }}
      className="space-y-4"
    >
      <div>
        <h4 className="text-sm font-semibold text-foreground">
          {t("suivi.eval.history")}
        </h4>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("suivi.eval.historyHint")}
        </p>
      </div>

      <div className="relative space-y-4 pl-0 sm:pl-4">
        <div
          className="absolute bottom-2 left-[7px] top-2 hidden w-px bg-border sm:block"
          aria-hidden
        />
        {sorted.map((evalu, index) => (
          <div key={evalu.idEvaluation || index} className="relative sm:pl-6">
            <span
              className={`absolute left-0 top-6 hidden size-3.5 rounded-full border-2 border-background sm:block ${
                index === 0 ? "bg-primary" : "bg-muted-foreground/40"
              }`}
              aria-hidden
            />
            <EvaluationCard
              evalu={evalu}
              index={index}
              isLatest={index === 0}
            />
          </div>
        ))}
      </div>
    </motion.section>
  );
}
