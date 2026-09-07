"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  CheckCircle2,
  ChevronRight,
  Loader2,
  Shield,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  useSecurityAlerts,
  useSecurityAlertsStats,
  useUpdateSecurityAlertStatus,
} from "@/lib/queries/useSecurityAlerts";

const GRAVITE_STYLE = {
  critique: "border-red-500/30 bg-red-500/5 text-red-700 dark:text-red-300",
  important: "border-orange-500/30 bg-orange-500/5 text-orange-700 dark:text-orange-300",
  attention: "border-amber-500/30 bg-amber-500/5 text-amber-800 dark:text-amber-200",
  information: "border-border bg-muted/40 text-muted-foreground",
};

function formatSince(iso, t) {
  if (!iso) return "—";
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return t("securityCenter.timeSecondsAgo", { n: sec });
  const min = Math.floor(sec / 60);
  if (min < 60) return t("securityCenter.timeMinutesAgo", { n: min });
  const h = Math.floor(min / 60);
  if (h < 48) return t("securityCenter.timeHoursAgo", { n: h });
  return t("securityCenter.timeDaysAgo", { n: Math.floor(h / 24) });
}

function graviteLabel(gravite, t) {
  const map = {
    critique: "alertsGraviteCritique",
    important: "alertsGraviteImportant",
    attention: "alertsGraviteAttention",
    information: "alertsGraviteInformation",
  };
  const key = map[gravite];
  return key ? t(`securityCenter.${key}`) : gravite;
}

export default function SecurityAlertsPanel({ compact = false }) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const [statut, setStatut] = useState("ouvertes");
  const [selected, setSelected] = useState(null);
  const statsQ = useSecurityAlertsStats();
  const listQ = useSecurityAlerts({ statut, limit: 30 });
  const updateStatus = useUpdateSecurityAlertStatus();

  const stats = statsQ.data || {};
  const items = listQ.data?.items || [];
  const loading = statsQ.isLoading || listQ.isLoading;

  const hasCritical = (stats.critiques || 0) > 0;
  const hasOpen = (stats.totalOuvertes || 0) > 0;

  return (
    <section className="space-y-3">
      <div
        className={cn(
          "rounded-2xl border px-4 py-3 sm:px-5",
          hasCritical
            ? "border-red-500/30 bg-red-500/[0.04]"
            : hasOpen
              ? "border-amber-500/25 bg-amber-500/[0.04]"
              : "border-emerald-500/20 bg-emerald-500/[0.04]",
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "mt-0.5 flex size-9 items-center justify-center rounded-xl",
                hasCritical
                  ? "bg-red-500/10 text-red-600"
                  : hasOpen
                    ? "bg-amber-500/10 text-amber-700"
                    : "bg-emerald-500/10 text-emerald-600",
              )}
            >
              {hasCritical || hasOpen ? (
                <ShieldAlert className="size-4" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {hasCritical
                  ? t("securityCenter.alertsActionRequired")
                  : hasOpen
                    ? t("securityCenter.alertsAttention")
                    : t("securityCenter.alertsAllClear")}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {hasCritical
                  ? t("securityCenter.alertsCriticalCount", {
                      n: stats.critiques || 0,
                    })
                  : hasOpen
                    ? t("securityCenter.alertsReviewCount", {
                        n: stats.aExaminer || 0,
                      })
                    : t("securityCenter.alertsNoneHint")}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-full border border-red-500/20 bg-red-500/5 px-2.5 py-1 font-medium text-red-700 dark:text-red-300">
              {t("securityCenter.alertsKpiCritical")}: {stats.critiques || 0}
            </span>
            <span className="rounded-full border border-orange-500/20 bg-orange-500/5 px-2.5 py-1 font-medium text-orange-700 dark:text-orange-300">
              {t("securityCenter.alertsKpiReview")}: {stats.aExaminer || 0}
            </span>
            <span className="rounded-full border border-border px-2.5 py-1 text-muted-foreground">
              {t("securityCenter.alertsKpiProgress")}: {stats.enCours || 0}
            </span>
            <span className="rounded-full border border-border px-2.5 py-1 text-muted-foreground">
              {t("securityCenter.alertsKpiResolved")}: {stats.resolues || 0}
            </span>
          </div>
        </div>
      </div>

      {!compact && (
        <>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground">
              {t("securityCenter.alertsTitle")}
            </h3>
            <div className="flex gap-1 rounded-lg border border-border p-0.5 text-[11px]">
              {[
                { v: "ouvertes", l: t("securityCenter.alertsFilterOpen") },
                { v: "toutes", l: t("securityCenter.alertsFilterAll") },
                { v: "resolue", l: t("securityCenter.alertsKpiResolved") },
              ].map((f) => (
                <button
                  key={f.v}
                  type="button"
                  onClick={() => setStatut(f.v)}
                  className={cn(
                    "rounded-md px-2.5 py-1 transition",
                    statut === f.v
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {f.l}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
              <CheckCircle2 className="mx-auto size-7 text-emerald-600/80" />
              <p className="mt-2 text-sm font-medium">
                {t("securityCenter.alertsNone")}
              </p>
              <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                {t("securityCenter.alertsNoneHint")}
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map((a) => (
                <li key={a.idAlerte}>
                  <button
                    type="button"
                    onClick={() =>
                      setSelected((s) =>
                        s?.idAlerte === a.idAlerte ? null : a,
                      )
                    }
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition hover:bg-muted/40",
                      GRAVITE_STYLE[a.gravite] || GRAVITE_STYLE.information,
                    )}
                  >
                    <Shield className="mt-0.5 size-4 shrink-0 opacity-80" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wide">
                          {graviteLabel(a.gravite, t)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatSince(a.dateDerniereDetection, t)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm font-medium text-foreground">
                        {a.titre}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {a.nomCible || a.emailCible || "—"}
                        {a.nbEvenements > 1
                          ? ` · ${t("securityCenter.alertsEvents", { n: a.nbEvenements })}`
                          : ""}
                      </p>
                    </div>
                    <ChevronRight className="size-4 shrink-0 opacity-50" />
                  </button>

                  <AnimatePresence>
                    {selected?.idAlerte === a.idAlerte && (
                      <motion.div
                        initial={reduce ? false : { opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={reduce ? undefined : { opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 space-y-3 rounded-xl border border-border bg-card p-4 text-sm">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                              {t("securityCenter.alertsWhy")}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {a.description}
                            </p>
                          </div>
                          {Array.isArray(a.signaux) && a.signaux.length > 0 && (
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                {t("securityCenter.alertsSignals")}
                              </p>
                              <ul className="mt-1 space-y-1">
                                {a.signaux.slice(0, 6).map((s, idx) => (
                                  <li
                                    key={idx}
                                    className="text-xs text-foreground/90"
                                  >
                                    •{" "}
                                    {typeof s === "string"
                                      ? s
                                      : s.label || s.code || JSON.stringify(s)}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                              {t("securityCenter.alertsRecommended")}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {t("securityCenter.alertsRecommendedBody")}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {a.statut === "nouvelle" && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={updateStatus.isPending}
                                onClick={() =>
                                  updateStatus.mutate({
                                    id: a.idAlerte,
                                    statut: "examinee",
                                  })
                                }
                              >
                                {t("securityCenter.alertsMarkReviewed")}
                              </Button>
                            )}
                            {a.statut !== "en_cours" &&
                              a.statut !== "resolue" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={updateStatus.isPending}
                                  onClick={() =>
                                    updateStatus.mutate({
                                      id: a.idAlerte,
                                      statut: "en_cours",
                                    })
                                  }
                                >
                                  {t("securityCenter.alertsMarkInvestigating")}
                                </Button>
                              )}
                            {a.statut !== "resolue" && (
                              <Button
                                size="sm"
                                disabled={updateStatus.isPending}
                                onClick={() =>
                                  updateStatus.mutate({
                                    id: a.idAlerte,
                                    statut: "resolue",
                                  })
                                }
                              >
                                {t("securityCenter.alertsMarkResolved")}
                              </Button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
