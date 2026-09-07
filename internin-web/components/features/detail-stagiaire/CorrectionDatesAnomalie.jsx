"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCorrigerDatesStage } from "@/lib/queries/useCorrigerDatesStage";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/useTranslation";

function toInputDate(value) {
  if (!value) return "";
  if (typeof value === "string") {
    const m = value.match(/^(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : "";
  }
  try {
    return new Date(value).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function formatDateYmd(ymd, locale = "fr") {
  if (!ymd) return "—";
  try {
    return new Date(`${ymd}T12:00:00`).toLocaleDateString(
      locale === "en" ? "en-GB" : "fr-FR",
      { day: "2-digit", month: "long", year: "numeric" },
    );
  } catch {
    return ymd;
  }
}

export default function CorrectionDatesAnomalie({
  idStage,
  dateDebut,
  dateFinPrevue,
  onCorrected,
}) {
  const { t, locale } = useTranslation();
  const reduce = useReducedMotion();
  const mut = useCorrigerDatesStage(idStage);
  const [nouvelleDate, setNouvelleDate] = useState(toInputDate(dateDebut));
  const [success, setSuccess] = useState(null);

  const debut = toInputDate(dateDebut);
  const fin = toInputDate(dateFinPrevue);
  const incoherent = debut && fin && fin < debut;

  function handleSubmit(e) {
    e.preventDefault();
    if (!nouvelleDate) return;
    mut.mutate(nouvelleDate, {
      onSuccess: (data) => {
        setSuccess({
          dateDebut: data.dateDebut,
          dateFinPrevue: data.dateFinPrevue,
        });
        onCorrected?.(data);
      },
    });
  }

  if (success) {
    return (
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduce ? 0 : 0.2 }}
        className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 shadow-sm"
      >
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
              {t("mesStagiaires.dates.success")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatDateYmd(success.dateDebut, locale)} →{" "}
              {formatDateYmd(success.dateFinPrevue, locale)}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.2 }}
      className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">
              {t("mesStagiaires.dates.warning")}
            </p>
            {incoherent && (
              <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive">
                {t("mesStagiaires.situation.critical")}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            {incoherent
              ? t("mesStagiaires.dates.endBeforeStart")
              : t("mesStagiaires.dates.adminRequested")}
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-2 rounded-lg border border-border/60 bg-background/60 px-3 py-2.5 text-xs sm:grid-cols-2">
        <div>
          <span className="text-muted-foreground">
            {t("mesStagiaires.detail.startDate")}
          </span>
          <p className="font-medium text-foreground">
            {formatDateYmd(debut, locale)}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">
            {t("mesStagiaires.detail.endDatePlanned")}
          </span>
          <p className="font-medium text-foreground">
            {formatDateYmd(fin, locale)}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label
            htmlFor="nouvelle-date-debut"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            {t("mesStagiaires.dates.newStartDate")}
          </label>
          <input
            id="nouvelle-date-debut"
            type="date"
            required
            value={nouvelleDate}
            onChange={(e) => setNouvelleDate(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          />
        </div>
        <Button
          type="submit"
          size="sm"
          disabled={mut.isPending || !nouvelleDate}
          className="shrink-0"
        >
          {mut.isPending ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              {t("mesStagiaires.common.loading")}
            </>
          ) : (
            t("mesStagiaires.dates.saveCorrection")
          )}
        </Button>
      </form>

      {mut.isError && (
        <p className="mt-2 text-xs text-destructive">
          {mut.error?.message || t("mesStagiaires.dates.saveError")}
        </p>
      )}
    </motion.div>
  );
}
