"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  FiUsers,
  FiBriefcase,
  FiClock,
  FiCheckCircle,
  FiClipboard,
  FiBell,
  FiChevronRight,
  FiInbox,
  FiActivity,
  FiAlertCircle,
} from "react-icons/fi";
import AppHeader from "@/components/layout/AppHeader";
import StatCard from "../dashboard-entreprise/StatCard";
import AlertCenter from "./AlertCenter";
import { CalendarPreview } from "./SupervisionCalendar";
import { useTableauDeBordSuperviseur } from "@/lib/queries/useSuperviseur";
import { useMonProfilEquipe } from "@/lib/queries/useEquipe";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { translateNotification } from "@/lib/notifications/translateNotif";

function getLocaleTag(locale) {
  return String(locale || "fr").toLowerCase().startsWith("en") ? "en-GB" : "fr-FR";
}

function formatDateLong(date, locale) {
  return date.toLocaleDateString(getLocaleTag(locale), {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateShort(dateStr, locale) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString(getLocaleTag(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function graviteStyle(key, t) {
  const map = {
    urgent: {
      bar: "bg-destructive",
      badge: "bg-destructive/10 text-destructive border-destructive/20",
      label: t("superviseurDashboard.severity.urgent"),
    },
    attention: {
      bar: "bg-amber-500",
      badge:
        "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400",
      label: t("superviseurDashboard.severity.attention"),
    },
    attente: {
      bar: "bg-primary/60",
      badge: "bg-primary/10 text-primary border-primary/20",
      label: t("superviseurDashboard.severity.pending"),
    },
  };
  return map[key] || map.attente;
}

function actionLabel(type, t) {
  const map = {
    evaluation: t("superviseurDashboard.actions.evaluate"),
    fin_stage: t("superviseurDashboard.actions.viewFollowUp"),
    journal: t("superviseurDashboard.actions.consult"),
  };
  return map[type] || t("superviseurDashboard.actions.view");
}

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
  },
};

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse" role="status" aria-busy="true">
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-md bg-muted" />
        <div className="h-4 w-72 max-w-full rounded-md bg-muted" />
        <div className="h-3 w-40 rounded-md bg-muted" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-32 rounded-md border border-border bg-card p-5"
          >
            <div className="mb-4 h-11 w-11 rounded-full bg-muted" />
            <div className="mb-2 h-7 w-12 rounded bg-muted" />
            <div className="h-4 w-28 rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="h-24 rounded-md border border-border bg-card p-5">
        <div className="mb-3 h-4 w-32 rounded bg-muted" />
        <div className="h-3 w-full rounded-full bg-muted" />
      </div>
      <div className="h-48 rounded-md border border-border bg-card p-5">
        <div className="mb-4 h-4 w-40 rounded bg-muted" />
        <div className="space-y-3">
          <div className="h-14 rounded-md bg-muted" />
          <div className="h-14 rounded-md bg-muted" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-44 rounded-md border border-border bg-card p-5" />
        <div className="h-44 rounded-md border border-border bg-card p-5" />
      </div>
    </div>
  );
}

function VueEnsemble({ compteurs }) {
  const { t } = useTranslation();
  const total =
    (compteurs.stagesEnCours || 0) +
    (compteurs.stagesBientotTermines || 0) +
    (compteurs.stagesTermines || 0);

  const segments = [
    {
      key: "cours",
      label: t("superviseurDashboard.overview.inProgress"),
      value: compteurs.stagesEnCours || 0,
      className: "bg-secondary",
    },
    {
      key: "bientot",
      label: t("superviseurDashboard.overview.endingSoon"),
      value: compteurs.stagesBientotTermines || 0,
      className: "bg-amber-500",
    },
    {
      key: "termines",
      label: t("superviseurDashboard.overview.completed"),
      value: compteurs.stagesTermines || 0,
      className: "bg-emerald-500",
    },
  ];

  return (
    <div className="rounded-md border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-foreground">
            {t("superviseurDashboard.overview.title")}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("superviseurDashboard.overview.subtitle")}
          </p>
        </div>
        <span className="text-xs font-semibold tabular-nums text-muted-foreground">
          {t("superviseurDashboard.overview.total", { count: total })}
        </span>
      </div>
      {total === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          {t("superviseurDashboard.overview.empty")}
        </p>
      ) : (
        <>
          <div
            className="flex h-3 w-full overflow-hidden rounded-full bg-muted"
            role="img"
            aria-label={t("superviseurDashboard.overview.title")}
          >
            {segments.map((s) => {
              const pct = total > 0 ? (s.value / total) * 100 : 0;
              if (pct <= 0) return null;
              return (
                <div
                  key={s.key}
                  className={s.className}
                  style={{ width: `${pct}%` }}
                  title={`${s.label}: ${s.value}`}
                />
              );
            })}
          </div>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            {segments.map((s) => (
              <li
                key={s.key}
                className="inline-flex items-center gap-2 text-xs text-muted-foreground"
              >
                <span
                  className={`size-2.5 rounded-full ${s.className}`}
                  aria-hidden
                />
                <span className="font-medium text-foreground">{s.label}</span>
                <span className="tabular-nums">{s.value}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function ActivitesTimeline({ activites }) {
  const { t, locale } = useTranslation();
  const list = Array.isArray(activites) ? activites : [];
  const reduceMotion = useReducedMotion();

  return (
    <div className="rounded-md border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <FiActivity className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">
          {t("superviseurDashboard.activity.title")}
        </h3>
      </div>

      {list.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {t("superviseurDashboard.activity.empty")}
        </p>
      ) : (
        <ul className="relative space-y-0">
          {list.map((a, index) => (
            <motion.li
              key={a.idEvaluation || index}
              initial={reduceMotion ? false : { opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: reduceMotion ? 0 : index * 0.05, duration: 0.3 }}
              className="relative flex gap-3 pb-5 last:pb-0"
            >
              <div className="relative flex flex-col items-center">
                <span className="z-10 mt-1 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-primary bg-card" />
                {index < list.length - 1 && (
                  <span className="absolute top-3 bottom-0 w-px bg-border" />
                )}
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm font-semibold text-foreground">
                  {[a.prenomStagiaire, a.nomStagiaire].filter(Boolean).join(" ") ||
                    t("superviseurDashboard.activity.internFallback")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("superviseurDashboard.activity.evalWeekSubmitted", {
                    week: a.numeroSemaine ?? "—",
                  })}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground/80">
                  {formatDateShort(a.dateSoumission, locale)}
                </p>
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NotificationsImportantes({ notifications }) {
  const { t, locale } = useTranslation();
  const list = Array.isArray(notifications) ? notifications : [];

  return (
    <div className="rounded-md border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FiBell className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">
            {t("superviseurDashboard.notifications.title")}
          </h3>
        </div>
        <Link
          href="/notifications"
          className="text-xs font-semibold text-primary hover:underline"
        >
          {t("superviseurDashboard.notifications.viewAll")}
        </Link>
      </div>

      {list.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {t("superviseurDashboard.notifications.empty")}
        </p>
      ) : (
        <ul className="space-y-2">
          {list.map((n) => {
            const unread = n.lu === false || n.lue === false;
            const { titre, message } = translateNotification(n, t);
            return (
              <li
                key={n.idNotification || n.id}
                className={`flex gap-3 rounded-md border px-3 py-3 transition-colors ${
                  unread
                    ? "border-primary/20 bg-primary/[0.04]"
                    : "border-border/60 bg-background"
                }`}
              >
                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    unread
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {unread ? (
                    <FiAlertCircle className="h-4 w-4" />
                  ) : (
                    <FiBell className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {titre || n.titre}
                  </p>
                  {(message || n.message) && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {message || n.message}
                    </p>
                  )}
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                    {(n.dateCreation || n.createdAt) && (
                      <span>
                        {formatDateShort(n.dateCreation || n.createdAt, locale)}
                      </span>
                    )}
                    {unread && (
                      <span className="font-semibold text-primary">
                        {t("superviseurDashboard.notifications.unread")}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function SuperviseurDashboardContent() {
  const { t, locale } = useTranslation();
  const reduceMotion = useReducedMotion();
  const { data: profil } = useMonProfilEquipe();
  const { data, isLoading, isError, refetch, isFetching } =
    useTableauDeBordSuperviseur();

  const prenom =
    profil?.prenom ||
    profil?.nom?.split?.(" ")?.[0] ||
    "";

  const itemMotion = reduceMotion
    ? {}
    : { variants: itemVariants };

  return (
    <>
      <AppHeader
        title={t("superviseurDashboard.title")}
        subtitle={t("superviseurDashboard.subtitle")}
        refreshKeys={["superviseur-dashboard"]}
      />
      <div className="w-full space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {prenom
              ? t("superviseurDashboard.greetingName", { name: prenom })
              : t("superviseurDashboard.greeting")}
          </h1>
          <p className="text-sm text-muted-foreground capitalize">
            {formatDateLong(new Date(), locale)}
          </p>
        </div>

        {isLoading && <DashboardSkeleton />}

        {isError && !isLoading && (
          <div className="rounded-2xl border border-destructive/25 bg-destructive/5 px-5 py-8 text-center">
            <FiAlertCircle className="mx-auto mb-2 size-8 text-destructive/80" />
            <p className="text-sm font-semibold text-foreground">
              {t("superviseurDashboard.error.title")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("superviseurDashboard.error.hint")}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 text-sm font-semibold text-primary hover:underline"
            >
              {t("superviseurDashboard.error.retry")}
            </button>
          </div>
        )}

        {data && !isLoading && (
          <motion.div
            className="space-y-6"
            variants={reduceMotion ? undefined : containerVariants}
            initial={reduceMotion ? false : "hidden"}
            animate="show"
          >
            {isFetching && (
              <p className="text-xs text-muted-foreground" aria-live="polite">
                {t("superviseurDashboard.updating")}
              </p>
            )}

            <motion.section
              {...itemMotion}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
            >
              <StatCard
                icon={FiUsers}
                value={data.compteurs?.stagiairesSupervises ?? 0}
                label={t("superviseurDashboard.stats.supervisedInterns")}
                color="bg-primary/10 text-primary"
              />
              <StatCard
                icon={FiBriefcase}
                value={data.compteurs?.stagesEnCours ?? 0}
                label={t("superviseurDashboard.stats.activeInternships")}
                color="bg-secondary/20 text-secondary-foreground"
                highlight
              />
              <StatCard
                icon={FiClock}
                value={data.compteurs?.stagesBientotTermines ?? 0}
                label={t("superviseurDashboard.stats.endingSoon")}
                sublabel={t("superviseurDashboard.stats.endingSoonSub")}
                color="bg-amber-500/15 text-amber-700 dark:text-amber-400"
              />
              <StatCard
                icon={FiCheckCircle}
                value={data.compteurs?.stagesTermines ?? 0}
                label={t("superviseurDashboard.stats.completedInternships")}
                color="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              />
            </motion.section>

            <motion.section
              {...itemMotion}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            >
              <StatCard
                icon={FiClipboard}
                value={data.compteurs?.evaluationsAEffectuer ?? 0}
                label={t("superviseurDashboard.stats.evaluationsDue")}
                sublabel={t("superviseurDashboard.stats.evaluationsDueSub")}
                color="bg-destructive/10 text-destructive"
              />
              <StatCard
                icon={FiBell}
                value={data.notificationsNonLues ?? 0}
                label={t("superviseurDashboard.stats.unreadNotifications")}
                color="bg-primary/10 text-primary"
              />
            </motion.section>

            <motion.section {...itemMotion}>
              <VueEnsemble compteurs={data.compteurs || {}} />
            </motion.section>

            <motion.section
              {...itemMotion}
              id="alertes"
              className="grid grid-cols-1 gap-4 xl:grid-cols-5"
            >
              <div className="xl:col-span-3">
                <AlertCenter items={data.aTraiterAujourdhui || []} />
              </div>
              <div className="xl:col-span-2">
                <CalendarPreview limit={5} />
              </div>
            </motion.section>

            <motion.section
              {...itemMotion}
              className="grid grid-cols-1 gap-4 lg:grid-cols-2"
            >
              <ActivitesTimeline activites={data.activitesRecentes || []} />
              <NotificationsImportantes
                notifications={data.notifications || []}
              />
            </motion.section>
          </motion.div>
        )}
      </div>
    </>
  );
}
