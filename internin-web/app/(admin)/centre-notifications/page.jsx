"use client";

/**
 * Admin → Centre de notifications — Notification Intelligence Center
 * Refonte UI/UX uniquement. Hooks, API, filtres, read/unread, pagination conservés.
 *
 * Données : idNotification, titre, message, type, priorite, categorie, lu, dateCreation, lien
 * Priorités : critique | important | attention | info
 * Catégories : stages, conventions, candidatures, entretiens, entreprises, securite,
 *              anomalies, utilisateurs, administration, signalements, offres, systeme
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import {
  Search,
  Loader2,
  CheckCheck,
  X,
  ExternalLink,
  Bell,
} from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
import AdminPageHeader from "@/components/layout/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { translateNotification } from "@/lib/notifications/translateNotif";
import {
  useAdminNotifications,
  useAdminNotificationsStats,
  useMarquerNotifLueAdmin,
  useMarquerToutesLuesAdmin,
} from "@/lib/queries/useAdminNotifications";

const PRIORITE_DOT = {
  critique: "bg-destructive",
  important: "bg-amber-500",
  attention: "bg-sky-500",
  info: "bg-muted-foreground/50",
};

const PRIORITE_TEXT = {
  critique: "text-destructive",
  important: "text-amber-700 dark:text-amber-400",
  attention: "text-sky-700 dark:text-sky-400",
  info: "text-muted-foreground",
};

const CAT_LABEL_KEYS = {
  stages: "adminNotifications.catStages",
  conventions: "adminNotifications.catConventions",
  candidatures: "adminNotifications.catCandidatures",
  entretiens: "adminNotifications.catEntretiens",
  entreprises: "adminNotifications.catEntreprises",
  securite: "adminNotifications.catSecurite",
  anomalies: "adminNotifications.catAnomalies",
  utilisateurs: "adminNotifications.catUtilisateurs",
  administration: "adminNotifications.catAdministration",
  signalements: "adminNotifications.catSignalements",
  offres: "adminNotifications.catOffres",
  systeme: "adminNotifications.catSysteme",
};

const STATUT_TAB_DEFS = [
  { value: "toutes", labelKey: "adminNotifications.all" },
  { value: "non_lues", labelKey: "adminNotifications.unread" },
  { value: "lues", labelKey: "adminNotifications.read" },
];

const PRIORITE_TAB_DEFS = [
  { value: "toutes", labelKey: "adminNotifications.allPriorities" },
  { value: "critique", labelKey: "adminNotifications.priorityCritical" },
  { value: "important", labelKey: "adminNotifications.priorityImportant" },
  { value: "attention", labelKey: "adminNotifications.priorityAttention" },
  { value: "info", labelKey: "adminNotifications.priorityInfo" },
];

const CAT_TAB_DEFS = [
  { value: "toutes", labelKey: "adminNotifications.all" },
  { value: "securite", labelKey: "adminNotifications.catSecurite" },
  { value: "signalements", labelKey: "adminNotifications.catSignalements" },
  { value: "utilisateurs", labelKey: "adminNotifications.catUtilisateurs" },
  { value: "entreprises", labelKey: "adminNotifications.catEntreprises" },
  { value: "anomalies", labelKey: "adminNotifications.catAnomalies" },
  { value: "systeme", labelKey: "adminNotifications.catSysteme" },
];

function formatDepuis(v, t) {
  if (!v) return "—";
  const sec = Math.floor((Date.now() - new Date(v).getTime()) / 1000);
  if (sec < 60) return t("adminNotifications.agoMinutes", { n: 0 });
  const min = Math.floor(sec / 60);
  if (min < 60) return t("adminNotifications.agoMinutes", { n: min });
  const h = Math.floor(min / 60);
  if (h < 24) return t("adminNotifications.agoHours", { n: h });
  const days = Math.floor(h / 24);
  if (days < 7) return t("adminNotifications.agoDays", { n: days });
  try {
    return new Date(v).toLocaleDateString(t("adminNotifications.localeDate"), {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Africa/Douala",
    });
  } catch {
    return String(v);
  }
}

function formatDateTime(v, t) {
  if (!v) return { date: "—", time: "" };
  try {
    const d = new Date(v);
    const loc = t("adminNotifications.localeDate");
    return {
      date: d.toLocaleDateString(loc, {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Africa/Douala",
      }),
      time: d.toLocaleTimeString(loc, {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Africa/Douala",
      }),
    };
  } catch {
    return { date: String(v), time: "" };
  }
}

function dayKey(v) {
  if (!v) return "unknown";
  const d = new Date(v);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startThat = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((startToday - startThat) / 86400000);
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return "week";
  return startThat.toISOString().slice(0, 10);
}

function dayLabel(key, t) {
  if (key === "today") return t("adminNotifications.today");
  if (key === "yesterday") return t("adminNotifications.yesterday");
  if (key === "week") return t("adminNotifications.earlierWeek");
  try {
    return new Date(key + "T12:00:00").toLocaleDateString(
      t("adminNotifications.localeDate"),
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      },
    );
  } catch {
    return key;
  }
}

function actionLabel(n, t) {
  const c = n.categorie;
  if (c === "securite" || c === "anomalies")
    return t("adminNotifications.actionInvestigate");
  if (c === "signalements") return t("adminNotifications.actionReviewReport");
  if (c === "utilisateurs") return t("adminNotifications.actionViewUser");
  if (c === "entreprises") return t("adminNotifications.actionViewCompany");
  if (c === "stages" || c === "conventions" || c === "offres")
    return t("adminNotifications.actionViewDetails");
  return t("adminNotifications.actionOpen");
}

function catLabel(categorie, t) {
  const key = CAT_LABEL_KEYS[categorie];
  return key ? t(key) : categorie || t("adminNotifications.system");
}

export default function CentreNotificationsPage() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const [recherche, setRecherche] = useState("");
  const [statut, setStatut] = useState("toutes");
  const [priorite, setPriorite] = useState("toutes");
  const [categorie, setCategorie] = useState("toutes");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  const params = useMemo(
    () => ({
      recherche: recherche.trim() || undefined,
      statut,
      priorite,
      categorie,
      page,
      limit: 25,
    }),
    [recherche, statut, priorite, categorie, page],
  );

  const { data, isLoading, isError, error, refetch, isFetching, dataUpdatedAt } =
    useAdminNotifications(params);
  const { data: stats } = useAdminNotificationsStats();
  const markOne = useMarquerNotifLueAdmin();
  const markAll = useMarquerToutesLuesAdmin();

  const STATUT_TABS = STATUT_TAB_DEFS.map((x) => ({
    ...x,
    label: t(x.labelKey),
  }));
  const PRIORITE_TABS = PRIORITE_TAB_DEFS.map((x) => ({
    ...x,
    label: t(x.labelKey),
  }));
  const CAT_TABS = CAT_TAB_DEFS.map((x) => ({
    ...x,
    label: t(x.labelKey),
  }));

  const rows = data?.notifications || [];
  const pagination = data?.pagination;

  const grouped = useMemo(() => {
    const map = new Map();
    for (const n of rows) {
      const k = dayKey(n.dateCreation);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(n);
    }
    return [...map.entries()];
  }, [rows]);

  function openNotif(n) {
    setSelected(n);
    if (!n.lu) markOne.mutate(n.idNotification);
  }

  function setFilter(setter) {
    return (value) => {
      setter(value);
      setPage(1);
    };
  }

  return (
    <>
      <AppHeader breadcrumb={[{ label: t("adminNotifications.breadcrumbAdmin") }, { label: t("adminNotifications.breadcrumbAwareness") }]} refreshKeys={["adminNotifications", "adminNotificationsStats"]} />

      <motion.div
        className="space-y-6 px-4 py-5 sm:px-6"
        initial={reduce ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <AdminPageHeader
          context={t("adminNotifications.context")}
          title={t("adminNotifications.title")}
          description={t("adminNotifications.description")}
          metadata={<>
              <span className="font-semibold text-foreground">{stats?.nonLues ?? 0}</span>{" "}{t("adminNotifications.unread").toLowerCase()}
              {isFetching ? ` · ${t("adminNotifications.updating")}` : null}
            </>}
          actions={<Button type="button" variant="outline" size="sm" className="h-9 text-xs font-semibold" disabled={markAll.isPending || !stats?.nonLues} onClick={() => markAll.mutate()}>
              {markAll.isPending ? "…" : t("adminNotifications.markAllRead")}
            </Button>}
        />

        {/* Summary — editorial, not KPI cards */}
        <div className="rounded-lg border border-border bg-card px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {t("adminNotifications.summary")}
          </p>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-8 gap-y-3">
            <SummaryStat value={stats?.nonLues} label={t("adminNotifications.unread")} />
            <span className="hidden h-8 w-px bg-border sm:block" />
            <SummaryStat value={stats?.prioritaires} label={t("adminNotifications.important")} />
            <span className="hidden h-8 w-px bg-border sm:block" />
            <SummaryStat value={stats?.actionsRequises} label={t("adminNotifications.actionNeeded")} />
            <span className="hidden h-8 w-px bg-border sm:block" />
            <SummaryStat value={stats?.aujourdhui} label={t("adminNotifications.today")} />
            <span className="hidden h-8 w-px bg-border sm:block" />
            <SummaryStat value={stats?.total} label={t("adminNotifications.recentTotal")} />
          </div>
        </div>

        {/* Needs attention — from real stats.prioriteItems */}
        <section className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-4 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Needs your attention
            </p>
          </div>
          {!stats?.prioriteItems?.length ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">
              You&apos;re all caught up. No priority notifications.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {stats.prioriteItems.map((n) => (
                <li key={n.idNotification}>
                  <button
                    type="button"
                    onClick={() => openNotif(n)}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-muted/30"
                  >
                    <span
                      className={cn(
                        "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                        PRIORITE_DOT[n.priorite] || PRIORITE_DOT.info,
                      )}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <p className="text-sm font-semibold text-foreground">
                          {translateNotification(n, t).titre}
                        </p>
                        <span
                          className={cn(
                            "text-[10px] font-semibold uppercase tracking-wide",
                            PRIORITE_TEXT[n.priorite],
                          )}
                        >
                          {n.priorite}
                        </span>
                      </div>
                      {translateNotification(n, t).message && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                          {translateNotification(n, t).message}
                        </p>
                      )}
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {catLabel(n.categorie, t) || n.categorie || t("adminNotifications.system")}
                        {" · "}
                        {formatDepuis(n.dateCreation, t)}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-primary">
                      {actionLabel(n, t)} →
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Search + filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={recherche}
              onChange={(e) => {
                setRecherche(e.target.value);
                setPage(1);
              }}
              placeholder={t("adminNotifications.searchPlaceholder")}
              className="h-11 w-full rounded-lg border border-border bg-card pl-10 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/30"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-card p-1">
            {STATUT_TABS.map((tab) => (
              <FilterChip
                key={tab.value}
                active={statut === tab.value}
                onClick={() => setFilter(setStatut)(tab.value)}
                label={tab.label}
              />
            ))}
          </div>

          <div className="flex flex-wrap gap-1">
            {PRIORITE_TABS.map((tab) => (
              <FilterChip
                key={tab.value}
                active={priorite === tab.value}
                onClick={() => setFilter(setPriorite)(tab.value)}
                label={tab.label}
                subtle
              />
            ))}
          </div>

          <div className="flex flex-wrap gap-1">
            {CAT_TABS.map((tab) => (
              <FilterChip
                key={tab.value}
                active={categorie === tab.value}
                onClick={() => setFilter(setCategorie)(tab.value)}
                label={tab.label}
                subtle
              />
            ))}
          </div>
        </div>

        {/* Error */}
        {isError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error?.message || t("adminNotifications.loadError")}
            <button
              type="button"
              onClick={() => refetch()}
              className="ml-2 font-semibold underline underline-offset-2"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="space-y-0 rounded-lg border border-border bg-card divide-y divide-border">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-3 px-4 py-3.5">
                <Skeleton className="mt-1.5 h-2 w-2 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3 max-w-xs" />
                  <Skeleton className="h-3 w-full max-w-md" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && rows.length === 0 && (
          <div className="rounded-lg border border-border bg-card px-6 py-16 text-center">
            <Bell className="mx-auto h-7 w-7 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-semibold text-foreground">
              {recherche || statut !== "toutes" || priorite !== "toutes" || categorie !== "toutes"
                ? t("adminNotifications.emptyTitle")
                : "You're all caught up"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {recherche || statut !== "toutes" || priorite !== "toutes" || categorie !== "toutes"
                ? t("adminNotifications.emptyFiltered")
                : t("adminNotifications.emptyDefault")}
            </p>
            {(recherche || statut !== "toutes" || priorite !== "toutes" || categorie !== "toutes") && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setRecherche("");
                  setStatut("toutes");
                  setPriorite("toutes");
                  setCategorie("toutes");
                  setPage(1);
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        )}

        {/* Recent list grouped by date */}
        {!isLoading && !isError && rows.length > 0 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Recent
              </p>
              {pagination && (
                <p className="text-[11px] tabular-nums text-muted-foreground">
                  Showing{" "}
                  {(pagination.page - 1) * (pagination.limit || 25) + 1}
                  –
                  {Math.min(
                    pagination.page * (pagination.limit || 25),
                    pagination.total || rows.length,
                  )}{" "}
                  of {pagination.total ?? rows.length}
                </p>
              )}
            </div>

            {grouped.map(([key, items]) => (
              <section key={key}>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  {dayLabel(key, t)}
                </p>
                <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
                  {items.map((n) => (
                    <li key={n.idNotification}>
                      <button
                        type="button"
                        onClick={() => openNotif(n)}
                        className={cn(
                          "flex w-full items-start gap-3 px-4 py-3.5 text-left transition hover:bg-muted/30",
                          !n.lu && "bg-muted/20",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                            !n.lu
                              ? PRIORITE_DOT[n.priorite] || PRIORITE_DOT.info
                              : "border border-muted-foreground/40 bg-transparent",
                          )}
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "text-sm text-foreground",
                              !n.lu ? "font-semibold" : "font-medium",
                            )}
                          >
                            {translateNotification(n, t).titre}
                          </p>
                          {translateNotification(n, t).message && (
                            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                              {translateNotification(n, t).message}
                            </p>
                          )}
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            <span className="font-medium text-foreground/70">
                              {catLabel(n.categorie, t) || n.categorie || t("adminNotifications.system")}
                            </span>
                            {" · "}
                            {formatDepuis(n.dateCreation, t)}
                            {n.priorite && n.priorite !== "info" ? (
                              <>
                                {" · "}
                                <span
                                  className={cn(
                                    "font-semibold uppercase tracking-wide",
                                    PRIORITE_TEXT[n.priorite],
                                  )}
                                >
                                  {n.priorite}
                                </span>
                              </>
                            ) : null}
                          </p>
                        </div>
                        <span className="shrink-0 self-center text-xs font-medium text-primary opacity-0 transition group-hover:opacity-100 sm:opacity-60">
                          {actionLabel(n, t)} →
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}

            {/* Pagination */}
            {pagination && (pagination.totalPages > 1 || pagination.pages > 1) && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Page {pagination.page} /{" "}
                  {pagination.totalPages || pagination.pages}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || isFetching}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={
                      page >= (pagination.totalPages || pagination.pages) ||
                      isFetching
                    }
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Detail drawer */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.button
              type="button"
              aria-label={t("adminNotifications.close")}
              className="absolute inset-0 bg-black/30"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label={t("adminNotifications.detail")}
              initial={reduce ? false : { x: 24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={reduce ? undefined : { x: 24, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-xl"
            >
              <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3.5">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Notification
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        PRIORITE_DOT[selected.priorite] || PRIORITE_DOT.info,
                      )}
                    />
                    <span
                      className={cn(
                        "text-[10px] font-semibold uppercase tracking-wide",
                        PRIORITE_TEXT[selected.priorite],
                      )}
                    >
                      {selected.priorite || "info"}
                    </span>
                  </div>
                  <h2 className="mt-1.5 text-base font-semibold leading-snug text-foreground">
                    {translateNotification(selected, t).titre}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                  aria-label={t("adminNotifications.close")}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4 text-sm">
                {selected.message && (
                  <section>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                      Message
                    </p>
                    <p className="mt-2 whitespace-pre-wrap leading-relaxed text-foreground">
                      {translateNotification(selected, t).message}
                    </p>
                  </section>
                )}

                <section className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                      Source
                    </p>
                    <p className="mt-1 text-foreground">
                      {catLabel(selected.categorie, t) ||
                        selected.categorie ||
                        "System"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                      Status
                    </p>
                    <p className="mt-1 text-foreground">
                      {selected.lu ? t("adminNotifications.read") : t("adminNotifications.unreadStatus")}
                    </p>
                  </div>
                </section>

                <section>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    Created
                  </p>
                  <p className="mt-1 text-foreground">
                    {formatDateTime(selected.dateCreation, t).date}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(selected.dateCreation, t).time}
                  </p>
                </section>

                {selected.type && (
                  <section>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                      Type
                    </p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {selected.type}
                    </p>
                  </section>
                )}

                {selected.lien && (
                  <section>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                      {t("adminNotifications.relatedResource")}
                    </p>
                    <Button asChild type="button" size="sm" className="mt-2 w-full gap-1.5">
                      <Link href={selected.lien}>
                        {actionLabel(selected, t)}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </section>
                )}
              </div>

              <div className="border-t border-border p-3">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setSelected(null)}
                >
                  Close
                </Button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function SummaryStat({ value, label }) {
  return (
    <div>
      <p className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
        {value ?? "—"}
      </p>
      <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function FilterChip({ active, onClick, label, subtle }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md px-2.5 py-1.5 text-xs font-semibold transition",
        active
          ? subtle
            ? "bg-muted text-foreground"
            : "bg-foreground text-background"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}
