"use client";

import Link from "next/link";
import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  FiArrowRight,
  FiLoader,
  FiUsers,
  FiBriefcase,
  FiHome,
  FiAlertTriangle,
  FiShield,
  FiFileText,
  FiClock,
} from "react-icons/fi";
import AppHeader from "@/components/layout/AppHeader";
import AdminPageHeader from "@/components/layout/AdminPageHeader";
import ActiviteRecenteList from "./ActiviteRecenteList";
import OffresParStatutCard from "./OffresParStatutCard";
import ActionsPrioritaires from "./ActionsPrioritaires";
import AdminDashboardSkeleton from "./AdminDashboardSkeleton";
import { useAdminStats } from "@/lib/queries/useAdminStats";
import { useAdminProfile } from "@/lib/queries/useAdminProfile";
import { useSecurityOverview } from "@/lib/queries/useSecurityCentre";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { cn } from "@/lib/utils";
import { toneOf } from "./adminDashTheme";

function greeting(t) {
  const h = new Date().getHours();
  if (h < 12) return t("adminDashboard.greetingMorning");
  if (h < 18) return t("adminDashboard.greetingAfternoon");
  return t("adminDashboard.greetingEvening");
}

function formatToday(locale) {
  try {
    return new Date().toLocaleDateString(locale || "fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}


function securityStatusCopy(security, t) {
  const etat = security?.etat;
  const kpi = security?.kpi || {};
  if (etat === "critique") {
    const n = kpi.comptesSuspectsCritiques ?? 0;
    return {
      label: t("adminDashboard.statusCritical"),
      message:
        n > 0
          ? t("adminDashboard.statusCriticalAccounts", { n })
          : t("adminDashboard.statusCriticalVolume"),
    };
  }
  if (etat === "attention") {
    return {
      label: t("adminDashboard.statusAttention"),
      message: t("adminDashboard.statusAttentionMsg", {
        suspects: kpi.comptesSuspects ?? 0,
        suspended: kpi.comptesSuspendus ?? 0,
        sensitive: kpi.actionsSensiblesAuj ?? 0,
      }),
    };
  }
  return {
    label: t("adminDashboard.statusSecure"),
    message: t("adminDashboard.statusOkHint"),
  };
}

export default function AdminDashboardContent() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const { data: stats, isLoading, isFetching, dataUpdatedAt, refetch, isError } =
    useAdminStats();
  const { data: profile } = useAdminProfile();
  const { data: security } = useSecurityOverview({ refetchInterval: 60_000 });

  const dateLocale = t("adminDashboard.localeDate");
  const timeLocale = t("adminDashboard.localeTime");

  const lastRefresh =
    dataUpdatedAt > 0
      ? new Date(dataUpdatedAt).toLocaleTimeString(timeLocale, {
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

  const etat = security?.etat;
  const isSecure = !etat || etat === "securisee";
  const isCritique = etat === "critique";
  const isAttention = etat === "attention";

  const name = profile?.nom?.split(/\s+/)[0] || "Admin";

  const statusCopy = securityStatusCopy(security, t);
  const statusTone = isCritique ? "red" : isAttention ? "amber" : "green";
  const statusSurface = toneOf(statusTone);

  const quickOps = useMemo(
    () => [
      {
        title: t("adminDashboard.opsReviewOffers"),
        description: t("adminDashboard.opsReviewOffersDesc"),
        href: "/verifications/offres-finales",
        tone: "teal",
        icon: FiFileText,
      },
      {
        title: t("adminDashboard.opsReviewCompanies"),
        description: t("adminDashboard.opsReviewCompaniesDesc"),
        href: "/gestion-entreprises",
        tone: "purple",
        icon: FiBriefcase,
      },
      {
        title: t("adminDashboard.opsReviewUniversities"),
        description: t("adminDashboard.opsReviewUniversitiesDesc"),
        href: "/gestion-universites",
        tone: "indigo",
        icon: FiHome,
      },
      {
        title: t("adminDashboard.opsReviewReports"),
        description: t("adminDashboard.opsReviewReportsDesc"),
        href: "/signalements",
        tone: "amber",
        icon: FiAlertTriangle,
      },
      {
        title: t("adminDashboard.opsSecurity"),
        description: t("adminDashboard.opsSecurityDesc"),
        href: "/centre-securite",
        tone: "red",
        icon: FiShield,
      },
      {
        title: t("adminDashboard.opsAudit"),
        description: t("adminDashboard.opsAuditDesc"),
        href: "/journal-audit",
        tone: "blue",
        icon: FiClock,
      },
    ],
    [t],
  );

  return (
    <>
      <AppHeader
        breadcrumb={[
          { label: t("adminDashboard.breadcrumbAdmin") },
          { label: t("adminDashboard.breadcrumbOps") },
        ]}
        refreshKeys={["adminStats", "notifications", "adminSecurityOverview"]}
        avatarLabel={profile?.nom?.slice(0, 2).toUpperCase()}
      />

      <motion.div
        className="space-y-6 px-4 py-5 sm:px-6"
        initial={reduce ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <AdminPageHeader
          context={t("adminDashboard.context")}
          title={`${greeting(t)}, ${name}`}
          description={t("adminDashboard.description")}
          metadata={
            <>
              {formatToday(dateLocale)}
              {lastRefresh && (
                <>
                  {" "}
                  · {t("adminDashboard.updated", { time: lastRefresh })}
                  {isFetching ? "…" : ""}
                </>
              )}
            </>
          }
          actions={
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-teal-500/20 bg-teal-500/5 px-3 text-xs font-semibold text-teal-800 transition hover:bg-teal-500/10 disabled:opacity-50 dark:text-teal-300"
            >
              {isFetching && <FiLoader className="h-3.5 w-3.5 animate-spin" />}
              {t("adminDashboard.refresh")}
            </button>
          }
        />
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-3 rounded-xl border px-5 py-3.5 shadow-sm",
            statusSurface.soft,
          )}
        >
          <div className="flex items-center gap-2.5">
            <span
              className={cn("h-2 w-2 rounded-full", statusSurface.dot)}
              aria-hidden
            />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {statusCopy.label}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {statusCopy.message}
              </p>
            </div>
          </div>
          <Link
            href="/centre-securite"
            className={cn(
              "inline-flex items-center gap-1 text-xs font-semibold",
              statusSurface.text,
            )}
          >
            {t("adminDashboard.securityCenter")}
            <FiArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {isLoading && <AdminDashboardSkeleton />}

        {isError && (
          <div className="rounded-xl border border-red-500/25 bg-red-500/[0.06] px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {t("adminDashboard.loadError")}
            <button
              type="button"
              onClick={() => refetch()}
              className="ml-2 font-semibold underline underline-offset-2"
            >
              {t("adminDashboard.retry")}
            </button>
          </div>
        )}

        {!isLoading && stats && (
          <>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
              <div className="space-y-4 lg:col-span-3">
                <section className="rounded-xl border border-border/80 bg-card px-5 py-4 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {t("adminDashboard.snapshot")}
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <Snapshot
                      label={t("adminDashboard.activeUsers")}
                      value={stats.utilisateursActifs?.total}
                      hint={
                        (stats.utilisateursActifs?.nouveauxCeMois ?? 0) > 0
                          ? t("adminDashboard.thisMonth", {
                              n: stats.utilisateursActifs.nouveauxCeMois,
                            })
                          : null
                      }
                      tone="blue"
                      icon={FiUsers}
                    />
                    <Snapshot
                      label={t("adminDashboard.pendingOffers")}
                      value={stats.offresEnAttente}
                      tone="amber"
                      icon={FiFileText}
                    />
                    <Snapshot
                      label={t("adminDashboard.entitiesToVerify")}
                      value={stats.entitesNonVerifiees?.total}
                      hint={t("adminDashboard.entitiesHint", {
                        co: stats.entitesNonVerifiees?.entreprises ?? 0,
                        univ: stats.entitesNonVerifiees?.universites ?? 0,
                      })}
                      tone="purple"
                      icon={FiBriefcase}
                    />
                    <Snapshot
                      label={t("adminDashboard.openReports")}
                      value={stats.signalementsOuverts}
                      tone={
                        (stats.signalementsOuverts ?? 0) > 0 ? "red" : "green"
                      }
                      icon={FiAlertTriangle}
                    />
                  </div>
                </section>

                <ActionsPrioritaires stats={stats} />
              </div>

              <div className="space-y-4 lg:col-span-2">
<OffresParStatutCard repartition={stats.offresParStatut} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <ActiviteRecenteList activite={stats.activiteRecente || []} />
              </div>
              <div className="lg:col-span-2">
                <section className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
                  <div className="border-b border-border/80 px-5 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      {t("adminDashboard.operations")}
                    </p>
                  </div>
                  <ul className="divide-y divide-border/80">
                    {quickOps.map((op) => {
                      const tone = toneOf(op.tone);
                      const Icon = op.icon;
                      return (
                        <li key={op.href}>
                          <Link
                            href={op.href}
                            className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-muted/30"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <span
                                className={cn(
                                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                                  tone.icon,
                                )}
                              >
                                <Icon className="h-3.5 w-3.5" aria-hidden />
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground">
                                  {op.title}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  {op.description}
                                </p>
                              </div>
                            </div>
                            <FiArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </>
  );
}

function Snapshot({ label, value, hint, tone = "neutral", icon: Icon }) {
  const toneStyles = toneOf(tone);
  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-center gap-2">
        {Icon && (
          <span
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg",
              toneStyles.icon,
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
          </span>
        )}
      </div>
      <p className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
        {value ?? "—"}
      </p>
      <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
        {label}
      </p>
      {hint && (
        <p className={cn("mt-0.5 text-[10px] font-medium", toneStyles.text)}>
          {hint}
        </p>
      )}
    </div>
  );
}
