"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  FiAlertCircle,
  FiAlertTriangle,
  FiAward,
  FiCheck,
  FiCheckCircle,
  FiChevronRight,
  FiClock,
  FiLoader,
  FiUser,
  FiBriefcase,
  FiCalendar,
  FiBookOpen,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTerminerStage } from "@/lib/queries/useStages";
import { useEvaluations } from "@/lib/queries/useEvaluations";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { getAvancement } from "@/components/features/suivi-stagiaires/stageUtils";
import { cn } from "@/lib/utils";

function localeTag(locale) {
  return locale === "en" || String(locale).startsWith("en") ? "en-GB" : "fr-FR";
}

function formatDate(d, locale) {
  if (!d) return null;
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(localeTag(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Construit la checklist à partir des données réelles du stage + évaluations.
 * severity: required | attention | optional
 * status: completed | incomplete | pending | not_required
 */
function buildValidationItems(stage, evaluations, t) {
  const list = Array.isArray(evaluations) ? evaluations : [];
  const hasEval = list.length > 0;
  const avancement = stage ? getAvancement(stage) : 0;
  const statut = stage?.statut;
  const canClose = statut === "actif" || statut === "en_cours";

  const items = [
    {
      id: "status",
      category: "admin",
      severity: "required",
      status: canClose || statut === "termine" ? "completed" : "incomplete",
      label: t("stage.validation.items.status"),
      detail:
        canClose || statut === "termine"
          ? t("stage.validation.items.statusOk")
          : t("stage.validation.items.statusBlocked"),
    },
    {
      id: "dates",
      category: "admin",
      severity: "required",
      status: stage?.dateDebut && stage?.dateFinPrevue ? "completed" : "incomplete",
      label: t("stage.validation.items.dates"),
      detail:
        stage?.dateDebut && stage?.dateFinPrevue
          ? t("stage.validation.items.datesOk")
          : t("stage.validation.items.datesMissing"),
    },
    {
      id: "position",
      category: "admin",
      severity: "optional",
      status: stage?.titrePoste ? "completed" : "incomplete",
      label: t("stage.validation.items.position"),
      detail: stage?.titrePoste
        ? t("stage.validation.items.positionOk")
        : t("stage.validation.items.positionMissing"),
    },
    {
      id: "tutor",
      category: "followUp",
      severity: "optional",
      status: stage?.nomTuteur ? "completed" : "incomplete",
      label: t("stage.validation.items.tutor"),
      detail: stage?.nomTuteur
        ? t("stage.validation.items.tutorOk")
        : t("stage.validation.items.tutorMissing"),
    },
    {
      id: "university",
      category: "admin",
      severity: "optional",
      status: stage?.nomUniversite ? "completed" : "incomplete",
      label: t("stage.validation.items.university"),
      detail: stage?.nomUniversite
        ? t("stage.validation.items.universityOk")
        : t("stage.validation.items.universityMissing"),
    },
    {
      id: "progress",
      category: "followUp",
      severity: "attention",
      status: avancement >= 70 ? "completed" : "incomplete",
      label: t("stage.validation.items.progress"),
      detail:
        avancement >= 70
          ? t("stage.validation.items.progressOk")
          : t("stage.validation.items.progressEarly"),
      href: null,
    },
    {
      id: "evaluation",
      category: "end",
      severity: "attention",
      status: hasEval ? "completed" : "incomplete",
      label: t("stage.validation.items.evaluation"),
      detail: hasEval
        ? t("stage.validation.items.evaluationOk")
        : t("stage.validation.items.evaluationMissing"),
      tab: "evaluation",
    },
  ];

  return { items, avancement };
}

function StatusIcon({ status }) {
  if (status === "completed") {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
        <FiCheck className="h-4 w-4" />
      </span>
    );
  }
  if (status === "incomplete") {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
        <FiAlertTriangle className="h-4 w-4" />
      </span>
    );
  }
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
      <FiClock className="h-4 w-4" />
    </span>
  );
}

export default function TerminerStageDialog({
  idStage,
  stagiaireNom,
  stage: stageProp,
}) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("review"); // review | confirm | success
  const mutation = useTerminerStage();
  const { data: evaluations, isLoading: loadingEval } = useEvaluations(
    open ? idStage : null,
  );

  const stage = stageProp || { idStage };

  const { items, avancement } = useMemo(
    () => buildValidationItems(stage, evaluations, t),
    [stage, evaluations, t],
  );

  const completed = items.filter((i) => i.status === "completed").length;
  const incomplete = items.filter((i) => i.status === "incomplete").length;
  const applicable = items.length;
  const progressPct =
    applicable === 0 ? 100 : Math.round((completed / applicable) * 100);
  const hasMissing = incomplete > 0;
  const displayName = stagiaireNom || t("stage.validation.intern");

  const categories = useMemo(() => {
    const order = [
      { id: "admin", label: t("stage.validation.categoryAdmin") },
      { id: "followUp", label: t("stage.validation.categoryFollowUp") },
      { id: "end", label: t("stage.validation.categoryEnd") },
    ];
    return order
      .map((cat) => ({
        ...cat,
        items: items.filter((i) => i.category === cat.id),
      }))
      .filter((c) => c.items.length > 0);
  }, [items, t]);

  function handleOpenChange(next) {
    setOpen(next);
    if (!next) {
      setView("review");
      mutation.reset();
    }
  }

  function handleValidate() {
    if (mutation.isPending) return;
    mutation.mutate(idStage, {
      onSuccess: () => setView("success"),
    });
  }

  function goToTab(tab) {
    handleOpenChange(false);
    // Navigation soft vers l'onglet évaluation si possible
    if (tab === "evaluation" && typeof window !== "undefined") {
      try {
        window.dispatchEvent(
          new CustomEvent("suivi:set-tab", { detail: { tab: "evaluation" } }),
        );
      } catch {
        /* ignore */
      }
    }
  }

  const fade = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.22 },
      };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" className="h-11 flex-1 gap-2 rounded-sm">
          <FiCheckCircle
            className="h-4 w-4 text-primary-foreground"
            aria-hidden
          />
          {t("stage.validation.trigger")}
        </Button>
      </DialogTrigger>

      <DialogContent
        className="flex max-h-[90vh] w-full flex-col gap-0 overflow-hidden rounded-md p-0 sm:max-w-[720px]"
        aria-describedby="valider-stage-desc"
      >
        {/* Header */}
        <div className="shrink-0 border-b border-border px-5 pb-4 pt-5 sm:px-6">
          <DialogHeader className="space-y-1 text-left">
            <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              {view === "success" ? (
                <FiAward className="h-5 w-5" />
              ) : (
                <FiCheckCircle className="h-5 w-5" />
              )}
            </div>
            <DialogTitle className="text-lg font-semibold">
              {view === "success"
                ? t("stage.validation.successTitle")
                : view === "confirm"
                  ? t("stage.validation.warningTitle")
                  : t("stage.validation.title")}
            </DialogTitle>
            <DialogDescription id="valider-stage-desc" className="text-sm">
              {view === "success"
                ? t("stage.validation.successMessage", {
                    studentName: displayName,
                  })
                : view === "confirm"
                  ? t("stage.validation.warningMessage")
                  : t("stage.validation.subtitle")}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Body scrollable */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          {view === "success" ? (
            <motion.div {...fade} className="flex flex-col items-center py-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                <FiCheck className="h-8 w-8" />
              </div>
              <p className="text-sm text-muted-foreground">
                {t("stage.validation.successHint")}
              </p>
            </motion.div>
          ) : view === "confirm" ? (
            <motion.div {...fade} className="space-y-4">
              <div className="rounded-md border border-amber-500/25 bg-amber-500/5 p-4">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  {t("stage.validation.summaryValidation")}
                </p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <FiCheck className="h-3.5 w-3.5 text-emerald-600" />
                    {t("stage.validation.completedCount", { count: completed })}
                  </li>
                  <li className="flex items-center gap-2">
                    <FiAlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                    {t("stage.validation.incompleteCount", { count: incomplete })}
                  </li>
                </ul>
                <p className="mt-3 text-xs font-medium text-foreground">
                  {t("stage.validation.statusWithMissing")}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("stage.validation.irreversible")}
              </p>
              {mutation.isError && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                  <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    {mutation.error?.message || t("stage.validation.error")}
                  </span>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div {...fade} className="space-y-5">
              {/* Stage summary card */}
              <div className="rounded-md border border-border bg-muted/30 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("stage.validation.summary")}
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="flex items-start gap-2.5">
                    <FiBriefcase className="mt-0.5 h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {t("stage.validation.stageLabel")}
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {stage?.titrePoste || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <FiUser className="mt-0.5 h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {t("stage.validation.intern")}
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {displayName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <FiCalendar className="mt-0.5 h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {t("stage.validation.period")}
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {[
                          formatDate(stage?.dateDebut, locale),
                          formatDate(stage?.dateFinPrevue, locale),
                        ]
                          .filter(Boolean)
                          .join(` ${t("stage.validation.dateSeparator")} `) || "—"}
                      </p>
                    </div>
                  </div>
                  {(stage?.nomUniversite || stage?.nomTuteur) && (
                    <div className="flex items-start gap-2.5">
                      <FiBookOpen className="mt-0.5 h-4 w-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {stage?.nomUniversite
                            ? t("stage.validation.department")
                            : t("stage.validation.tutor")}
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          {stage?.nomUniversite || stage?.nomTuteur}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">
                    {t("stage.validation.progressLabel")}
                  </p>
                  <span className="text-sm font-bold tabular-nums text-primary">
                    {loadingEval ? "…" : `${progressPct} %`}
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <motion.div
                    initial={shouldReduceMotion ? false : { width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className={cn(
                      "h-full rounded-full",
                      progressPct >= 100
                        ? "bg-emerald-500"
                        : progressPct >= 60
                          ? "bg-primary"
                          : "bg-amber-500",
                    )}
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>
                    {t("stage.validation.completedCount", { count: completed })}
                  </span>
                  <span>
                    {t("stage.validation.incompleteCount", { count: incomplete })}
                  </span>
                </div>
              </div>

              {/* Smart message */}
              <div
                className={cn(
                  "rounded-md border px-3.5 py-3 text-sm",
                  hasMissing
                    ? "border-amber-500/25 bg-amber-500/5 text-amber-900 dark:text-amber-200"
                    : "border-emerald-500/25 bg-emerald-500/5 text-emerald-800 dark:text-emerald-300",
                )}
              >
                <p className="font-semibold">
                  {hasMissing
                    ? t("stage.validation.attention")
                    : t("stage.validation.allReadyTitle")}
                </p>
                <p className="mt-0.5 text-xs opacity-90">
                  {hasMissing
                    ? t("stage.validation.missing", { count: incomplete })
                    : t("stage.validation.allReady")}
                </p>
              </div>

              {/* Checklist by category */}
              <div className="space-y-4">
                <p className="text-sm font-semibold text-foreground">
                  {t("stage.validation.checklistTitle")}
                </p>
                {categories.map((cat) => (
                  <div key={cat.id} className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {cat.label}
                    </p>
                    <ul className="space-y-2">
                      {cat.items.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-start gap-3 rounded-md border border-border bg-card px-3 py-2.5 transition hover:border-primary/20"
                        >
                          <StatusIcon status={item.status} />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-medium text-foreground">
                                {item.label}
                              </p>
                              <span
                                className={cn(
                                  "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                  item.severity === "required" &&
                                    "bg-primary/10 text-primary",
                                  item.severity === "attention" &&
                                    "bg-amber-500/10 text-amber-700 dark:text-amber-300",
                                  item.severity === "optional" &&
                                    "bg-muted text-muted-foreground",
                                )}
                              >
                                {item.severity === "required"
                                  ? t("stage.validation.required")
                                  : item.severity === "attention"
                                    ? t("stage.validation.attention").split(" ")[0]
                                    : t("stage.validation.optional")}
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {item.status === "completed"
                                ? t("stage.validation.completed")
                                : item.detail}
                            </p>
                          </div>
                          {item.tab && item.status === "incomplete" && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 shrink-0 gap-1 text-xs"
                              onClick={() => goToTab(item.tab)}
                            >
                              {t("stage.validation.completeNow")}
                              <FiChevronRight className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted-foreground">
                {t("stage.validation.irreversible")}
              </p>

              {mutation.isError && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                  <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    {mutation.error?.message || t("stage.validation.error")}
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Footer fixe */}
        <div className="shrink-0 border-t border-border bg-card px-5 py-3 sm:px-6">
          {view === "success" ? (
            <Button
              type="button"
              className="h-10 w-full rounded-md"
              onClick={() => handleOpenChange(false)}
            >
              {t("stage.validation.back")}
            </Button>
          ) : view === "confirm" ? (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-md"
                disabled={mutation.isPending}
                onClick={() => setView("review")}
              >
                {t("stage.validation.cancel")}
              </Button>
              <Button
                type="button"
                className="h-10 rounded-md"
                disabled={mutation.isPending}
                onClick={handleValidate}
              >
                {mutation.isPending ? (
                  <>
                    <FiLoader className="h-4 w-4 animate-spin" />
                    {t("stage.validation.loading")}
                  </>
                ) : (
                  t("stage.validation.confirm")
                )}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-md"
                disabled={mutation.isPending}
                onClick={() => handleOpenChange(false)}
              >
                {hasMissing
                  ? t("stage.validation.completeFirst")
                  : t("stage.validation.back")}
              </Button>
              {hasMissing ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="h-10 rounded-md"
                  disabled={mutation.isPending || loadingEval}
                  onClick={() => setView("confirm")}
                >
                  {t("stage.validation.validateAnyway")}
                </Button>
              ) : (
                <Button
                  type="button"
                  className="h-10 rounded-md gap-2"
                  disabled={mutation.isPending || loadingEval}
                  onClick={handleValidate}
                >
                  {mutation.isPending ? (
                    <>
                      <FiLoader className="h-4 w-4 animate-spin" />
                      {t("stage.validation.loading")}
                    </>
                  ) : (
                    <>
                      <FiCheckCircle className="h-4 w-4" />
                      {t("stage.validation.validate")}
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
