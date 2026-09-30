"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  FiAward,
  FiBriefcase,
  FiFileText,
  FiClock,
  FiArrowRight,
  FiAlertCircle,
  FiCheckCircle,
  FiLoader,
  FiRefreshCw,
} from "react-icons/fi";
import AppHeader from "@/components/layout/AppHeader";
import { useUniversiteStats } from "@/lib/queries/useUniversiteStats";
import { useUniversiteProfile } from "@/lib/queries/useUniversiteProfile";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { cn } from "@/lib/utils";
import RepartitionStagesCard from "./RepartitionStagesCard";
import EvolutionConventionsCard from "./EvolutionConventionsCard";
import AlertesConventionsCard from "./AlertesConventionsCard";

function formatLongDate(locale) {
  try {
    return new Date().toLocaleDateString(locale === "en" ? "en-GB" : "fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-64 max-w-full rounded-md bg-muted" />
        <div className="h-4 w-48 max-w-full rounded-md bg-muted" />
      </div>
      <div className="h-28 rounded-2xl bg-muted/60" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-muted/50" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-56 rounded-2xl bg-muted/50" />
        <div className="h-56 rounded-2xl bg-muted/50" />
      </div>
    </div>
  );
}

function KpiItem({ label, value, hint, accent = "teal" }) {
  const accentClass =
    accent === "purple"
      ? "text-[#5B3DF5] dark:text-[#A78BFA]"
      : accent === "amber"
        ? "text-amber-600 dark:text-amber-400"
        : "text-teal-600 dark:text-teal-400";

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card px-5 py-4 shadow-sm transition-colors hover:border-border">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-3 text-3xl font-bold tabular-nums tracking-tight text-foreground",
        )}
      >
        {value ?? 0}
      </p>
      {hint ? (
        <p className={cn("mt-1.5 text-xs font-medium", accentClass)}>{hint}</p>
      ) : (
        <span className="mt-1.5 block h-4" />
      )}
    </div>
  );
}

export default function UniversiteDashboardContent() {
  const { t, locale } = useTranslation();
  const reduce = useReducedMotion();
  const user = useAuthStore((s) => s.user);
  const {
    data: stats,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useUniversiteStats();
  const { data: profile } = useUniversiteProfile();

  const displayName =
    [user?.prenom, user?.nom].filter(Boolean).join(" ") ||
    profile?.nomCoordinateurStage ||
    "";

  const uniName = profile?.nomUniversite || "";
  const enAttente = stats?.conventionsEnAttente ?? 0;
  const alertes = Array.isArray(stats?.alertes) ? stats.alertes : [];
  const hasAttention = enAttente > 0 || alertes.length > 0;

  const motionProps = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.35, ease: "easeOut" },
      };

  const isEmpty =
    stats &&
    (stats.etudiantsInscrits ?? 0) === 0 &&
    (stats.entreprisesPartenaires ?? 0) === 0 &&
    (stats.conventionsActives ?? 0) === 0 &&
    (stats.conventionsEnAttente ?? 0) === 0 &&
    !(stats.repartitionStatuts?.actif ||
      stats.repartitionStatuts?.termine ||
      stats.repartitionStatuts?.interrompu);

  return (
    <>
      <AppHeader
        breadcrumb={[{ label: t("universiteSpace.dashboard.breadcrumb") }]}
        avatarLabel={
          profile?.nomCoordinateurStage?.slice(0, 2)?.toUpperCase() ||
          user?.prenom?.charAt(0)?.toUpperCase()
        }
        refreshKeys={["universiteStats", "universiteProfile", "notifications"]}
      />

      <div className="w-full space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        {/* Header d'accueil */}
        <motion.header {...motionProps} className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">
              {formatLongDate(locale)}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {displayName
                ? t("universiteSpace.dashboard.greetingName", {
                    name: displayName,
                  })
                : t("universiteSpace.dashboard.greeting")}
            </h1>
            {uniName ? (
              <p className="mt-1 text-sm font-medium text-foreground/80">
                {uniName}
              </p>
            ) : null}
            <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
              {t("universiteSpace.dashboard.subtitle")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                hasAttention
                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                  : "bg-teal-500/10 text-teal-700 dark:text-teal-300",
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  hasAttention ? "bg-amber-500" : "bg-teal-500",
                )}
              />
              {hasAttention
                ? t("universiteSpace.dashboard.statusAttention")
                : t("universiteSpace.dashboard.statusNormal")}
            </span>
          </div>
        </motion.header>

        {isLoading && <DashboardSkeleton />}

        {isError && !isLoading && (
          <div className="flex flex-col items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-6">
            <div className="flex items-center gap-2 text-sm font-medium text-destructive">
              <FiAlertCircle className="h-4 w-4 shrink-0" />
              {error?.message || t("universiteSpace.dashboard.loadError")}
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted"
            >
              <FiRefreshCw
                className={cn("h-3.5 w-3.5", isFetching && "animate-spin")}
              />
              {t("universiteSpace.dashboard.retry")}
            </button>
          </div>
        )}

        {!isLoading && !isError && stats && (
          <motion.div
            className="space-y-8"
            {...(reduce
              ? {}
              : {
                  initial: { opacity: 0 },
                  animate: { opacity: 1 },
                  transition: { duration: 0.3, delay: 0.05 },
                })}
          >
            {/* À traiter */}
            <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    {t("universiteSpace.dashboard.todoLabel")}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-foreground">
                    {t("universiteSpace.dashboard.todoTitle")}
                  </h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {t("universiteSpace.dashboard.todoSubtitle")}
                  </p>
                </div>
                <Link
                  href="/conventions"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:underline dark:text-teal-400"
                >
                  {t("universiteSpace.dashboard.viewAll")}
                  <FiArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {hasAttention ? (
                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {enAttente > 0 && (
                    <Link
                      href="/conventions"
                      className="group flex items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3.5 transition hover:border-amber-500/40"
                    >
                      <div>
                        <p className="text-2xl font-bold tabular-nums text-foreground">
                          {enAttente}
                        </p>
                        <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                          {enAttente > 1
                            ? t("universiteSpace.dashboard.todoConventionsOther")
                            : t("universiteSpace.dashboard.todoConventionsOne")}
                        </p>
                        <p className="mt-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                          {t("universiteSpace.dashboard.todoReview")}
                        </p>
                      </div>
                      <FiFileText className="h-5 w-5 text-amber-600/80 transition group-hover:translate-x-0.5 dark:text-amber-400" />
                    </Link>
                  )}
                  <div className="sm:col-span-2 lg:col-span-2">
                    <AlertesConventionsCard alertes={alertes} />
                  </div>
                </div>
              ) : (
                <div className="mt-5 flex items-center gap-3 rounded-xl border border-teal-500/15 bg-teal-500/[0.04] px-4 py-4">
                  <FiCheckCircle className="h-5 w-5 shrink-0 text-teal-600 dark:text-teal-400" />
                  <p className="text-sm text-muted-foreground">
                    {t("universiteSpace.dashboard.todoEmpty")}
                  </p>
                </div>
              )}
            </section>

            {/* KPI */}
            <section>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                {t("universiteSpace.dashboard.kpiLabel")}
              </p>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <KpiItem
                  label={t("universiteSpace.dashboard.kpiStudents")}
                  value={stats.etudiantsInscrits}
                  accent="teal"
                />
                <KpiItem
                  label={t("universiteSpace.dashboard.kpiPartners")}
                  value={stats.entreprisesPartenaires}
                  accent="purple"
                />
                <KpiItem
                  label={t("universiteSpace.dashboard.kpiActiveConventions")}
                  value={stats.conventionsActives}
                  accent="teal"
                />
                <KpiItem
                  label={t("universiteSpace.dashboard.kpiPendingConventions")}
                  value={stats.conventionsEnAttente}
                  accent="amber"
                  hint={
                    enAttente > 0
                      ? t("universiteSpace.dashboard.kpiPendingHint")
                      : undefined
                  }
                />
              </div>
            </section>

            {/* Stages + évolution */}
            <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <RepartitionStagesCard
                repartition={stats.repartitionStatuts}
              />
              <EvolutionConventionsCard
                depotsParMois={stats.depotsParMois}
              />
            </section>

            {/* Réseau entreprises — compteur réel uniquement */}
            <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    {t("universiteSpace.dashboard.networkLabel")}
                  </p>
                  <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">
                    {stats.entreprisesPartenaires ?? 0}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("universiteSpace.dashboard.networkPartners")}
                  </p>
                </div>
                <Link
                  href="/entreprises-universite"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-2 text-xs font-semibold text-foreground transition hover:bg-muted"
                >
                  {t("universiteSpace.dashboard.networkView")}
                  <FiArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </section>

            {isEmpty && (
              <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
                <p className="text-base font-semibold text-foreground">
                  {t("universiteSpace.dashboard.emptyTitle")}
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  {t("universiteSpace.dashboard.emptyDesc")}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </>
  );
}
