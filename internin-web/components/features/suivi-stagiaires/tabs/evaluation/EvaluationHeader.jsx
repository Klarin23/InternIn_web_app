"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
import { formatDate } from "./evaluationUtils";

export default function EvaluationHeader({ lastEvaluation, action }) {
  const { t, locale } = useTranslation();
  const dateLabel = lastEvaluation
    ? formatDate(lastEvaluation.dateSoumission, locale) ||
      (lastEvaluation.numeroSemaine != null
        ? `${t("suivi.eval.week")} ${lastEvaluation.numeroSemaine}`
        : t("suivi.eval.evaluation"))
    : null;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h3 className="text-base font-semibold text-foreground">
          {t("suivi.eval.title")}
        </h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {t("suivi.eval.subtitle")}
        </p>
        {lastEvaluation && dateLabel ? (
          <p className="mt-1.5 text-xs text-muted-foreground">
            {t("suivi.eval.lastEval")}{" "}
            <span className="font-medium text-foreground">{dateLabel}</span>
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
