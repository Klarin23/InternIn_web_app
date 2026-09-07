"use client";

/**
 * Admin → Dossiers de stage — Internship Case Management Center
 * Refonte UI/UX uniquement. Hooks, API, filtres, pagination, export conservés.
 *
 * Données liste (useSupervisionStages) :
 * idStage, code, intitulePoste, stagiaire.nomComplet, entreprise.nom,
 * universite.nom, dateDebut, dateFinPrevue, statut, progression.percent,
 * derniereActivite, nbAlertes
 *
 * Statuts : a_venir | actif | termine | interrompu (+ filtre anomalie)
 * Détail complet : /gestion-stages/[id]
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import {
  Search,
  Download,
  AlertTriangle,
  Loader2,
  XCircle,
  X,
  ExternalLink,
  FolderOpen,
} from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
import AdminPageHeader from "@/components/layout/AdminPageHeader";
import { useSupervisionStages } from "@/lib/queries/useSupervisionStages";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/useTranslation";

const STATUT_META = {
  a_venir: {
    labelKey: "adminStages.statusAVenir",
    dot: "bg-sky-500",
    text: "text-sky-700 dark:text-sky-400",
  },
  actif: {
    labelKey: "adminStages.statusActif",
    dot: "bg-teal-500",
    text: "text-teal-700 dark:text-teal-400",
  },
  termine: {
    labelKey: "adminStages.statusTermine",
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  interrompu: {
    labelKey: "adminStages.statusInterrompu",
    dot: "bg-muted-foreground/60",
    text: "text-muted-foreground",
  },
};

const FILTRE_TAB_DEFS = [
  { value: "tous", labelKey: "adminStages.filterAll" },
  { value: "anomalie", labelKey: "adminStages.filterAnomalie" },
  { value: "actif", labelKey: "adminStages.filterActif" },
  { value: "a_venir", labelKey: "adminStages.filterAVenir" },
  { value: "interrompu", labelKey: "adminStages.filterInterrompu" },
  { value: "termine", labelKey: "adminStages.filterTermine" },
];

function formatDate(v, t) {
  if (!v) return "—";
  try {
    const d = new Date(
      typeof v === "string" && v.length <= 10 ? v + "T12:00:00Z" : v,
    );
    return d.toLocaleDateString(t("adminStages.localeDate"), {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Africa/Douala",
    });
  } catch {
    return String(v);
  }
}

function formatDepuis(date, t) {
  if (!date) return "—";
  const days = Math.floor(
    (Date.now() - new Date(date).getTime()) / 86_400_000,
  );
  if (days <= 0) return t("adminStages.today");
  if (days === 1) return t("adminStages.yesterday");
  return t("adminStages.daysAgo", { n: days });
}


function fileCode(s) {
  if (s?.code) return s.code.startsWith("#") ? s.code : `#${s.code}`;
  const id = String(s?.idStage || "").replace(/-/g, "").slice(0, 4).toUpperCase();
  return `#INT-${id || "????"}`;
}

function exportCsv(stages, tFn) {
  const headers = [
    tFn("adminStages.colCode"),
    tFn("adminStages.colStudent"),
    tFn("adminStages.colCompany"),
    tFn("adminStages.colUniversity"),
    tFn("adminStages.colStart"),
    tFn("adminStages.colEnd"),
    tFn("adminStages.colStatus"),
    tFn("adminStages.colProgress"),
    tFn("adminStages.colAlerts"),
  ];
  const lines = stages.map((s) =>
    [
      s.code,
      s.stagiaire?.nomComplet,
      s.entreprise?.nom,
      s.universite?.nom || "",
      s.dateDebut,
      s.dateFinPrevue,
      s.statut,
      s.progression?.percent ?? "",
      s.nbAlertes,
    ]
      .map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`)
      .join(","),
  );
  const blob = new Blob([[headers.join(","), ...lines].join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `supervision-stages-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function StatusPill({ statut }) {
  const { t } = useTranslation();
  const meta = STATUT_META[statut] || STATUT_META.termine;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", meta.text)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {t(meta.labelKey)}
    </span>
  );
}

function ThinProgress({ percent, statut }) {
  const { t } = useTranslation();
  // N/D uniquement si vraiment inconnu (ex. stage interrompu sans saisie)
  if (percent == null || percent === "" || Number.isNaN(Number(percent))) {
    if (statut === "interrompu") {
      return <span className="text-[11px] text-muted-foreground">{t("adminStages.nd")}</span>;
    }
    // sinon afficher 0 % plutôt qu'un trou visuel
    percent = 0;
  }
  const p = Math.min(100, Math.max(0, Math.round(Number(percent))));
  return (
    <div className="flex min-w-[88px] items-center gap-2">
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-teal-500/80 transition-all duration-500"
          style={{ width: `${p}%` }}
        />
      </div>
      <span className="w-8 text-right text-[11px] tabular-nums text-muted-foreground">
        {p}%
      </span>
    </div>
  );
}


export default function SupervisionStagesPage() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const [recherche, setRecherche] = useState("");
  const [statut, setStatut] = useState("tous");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [selected, setSelected] = useState(null);

  const FILTRE_TABS = FILTRE_TAB_DEFS.map((x) => ({
    ...x,
    label: t(x.labelKey),
  }));

  function statutLabel(key) {
    const meta = STATUT_META[key];
    return meta ? t(meta.labelKey) : key;
  }


  const params = useMemo(
    () => ({
      recherche: recherche.trim() || undefined,
      statut,
      page,
      limit,
    }),
    [recherche, statut, page, limit],
  );

  const { data, isLoading, isError, error, refetch, isFetching } =
    useSupervisionStages(params);

  const stats = data?.stats;
  const stages = data?.stages || [];
  const pagination = data?.pagination;

  function openCase(s) {
    setSelected(s);
  }

  return (
    <>
      <AppHeader breadcrumb={[{ label: t("adminStages.breadcrumbAdmin") }, { label: t("adminStages.breadcrumbWorkflow") }]} refreshKeys={["adminSupervisionStages"]} />

      <motion.div
        className="space-y-6 px-4 py-5 sm:px-6"
        initial={reduce ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <AdminPageHeader
          context={t("adminStages.context")}
          title={t("adminStages.title")}
          description={t("adminStages.description")}
          metadata={<>
              <span className="font-semibold text-foreground">{stats?.actifs ?? "—"}</span>{" "}
              {t("adminStages.active")}
              {" · "}
              <span className="font-semibold text-foreground">{stats?.anomalies ?? "—"}</span>{" "}
              {t("adminStages.needsReview")}
              {isFetching ? ` · ${t("adminStages.updating")}` : null}
            </>}
          actions={<Button type="button" variant="outline" size="sm" className="h-9 gap-1.5 text-xs font-semibold" disabled={!stages.length} onClick={() => exportCsv(stages, t)}>
              <Download className="h-3.5 w-3.5" />
              {t("adminStages.exportCsv")}
            </Button>}
        />

        {/* Search + workflow filters */}
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
              placeholder={t("adminStages.searchPlaceholder")}
              className="h-11 w-full rounded-lg border border-border bg-card pl-10 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/30"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-card p-1">
            {FILTRE_TABS.map((tab) => {
              const active = statut === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => {
                    setStatut(tab.value);
                    setPage(1);
                  }}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-semibold transition",
                    active
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Error */}
        {isError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-center text-sm text-destructive">
            <XCircle className="mx-auto mb-1 h-5 w-5" />
            {error?.message || t("adminStages.loadError")}
            <div className="mt-2">
              <Button type="button" size="sm" onClick={() => refetch()}>
                {t("adminStages.retry")}
              </Button>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2 px-4 py-3.5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-64" />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && stages.length === 0 && (
          <div className="rounded-lg border border-border bg-card px-6 py-16 text-center">
            <FolderOpen className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-semibold text-foreground">
              {t("adminStages.emptyTitle")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {(stats?.anomalies ?? 0) === 0 && statut === "anomalie"
                ? t("adminStages.emptyAnomalie")
                : t("adminStages.emptyFiltered")}
            </p>
            {(recherche || statut !== "tous") && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setRecherche("");
                  setStatut("tous");
                  setPage(1);
                }}
              >
                {t("adminStages.clearFilters")}
              </Button>
            )}
          </div>
        )}

        {/* Case list */}
        {!isLoading && !isError && stages.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                {t("adminStages.cases")}
              </p>
              {pagination && (
                <p className="text-[11px] tabular-nums text-muted-foreground">
                  {t("adminStages.showingOf", {
                    from: (pagination.page - 1) * pagination.limit + 1,
                    to: Math.min(
                      pagination.page * pagination.limit,
                      pagination.total,
                    ),
                    total: pagination.total,
                  })}
                </p>
              )}
            </div>

            <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
              {stages.map((s) => {
                const hasAlerts = (s.nbAlertes || 0) > 0;
                return (
                  <li key={s.idStage}>
                    <button
                      type="button"
                      onClick={() => openCase(s)}
                      className={cn(
                        "flex w-full flex-col gap-2 px-4 py-3.5 text-left transition hover:bg-muted/30 sm:flex-row sm:items-center sm:gap-4",
                        hasAlerts && "bg-muted/15",
                      )}
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="font-mono text-[10px] font-medium tracking-wide text-muted-foreground">
                            {fileCode(s)}
                          </span>
                          <StatusPill statut={s.statut} />
                          {hasAlerts && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground">
                              <AlertTriangle className="h-3 w-3" />
                              {t(
                                s.nbAlertes > 1
                                  ? "adminStages.alertsShortPlural"
                                  : "adminStages.alertsShort",
                                { n: s.nbAlertes },
                              )}
                            </span>
                          )}
                          <span className="ml-auto text-[11px] text-muted-foreground sm:hidden">
                            {formatDepuis(s.derniereActivite, t)}
                          </span>
                        </div>
                        <p className="truncate text-sm font-semibold text-foreground">
                          {s.intitulePoste || t("adminStages.internship")}
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-muted-foreground">
                          <span>
                            <span className="text-muted-foreground/70">Student </span>
                            <span className="text-foreground/80">
                              {s.stagiaire?.nomComplet || "—"}
                            </span>
                          </span>
                          <span>
                            <span className="text-muted-foreground/70">Company </span>
                            <span className="text-foreground/80">
                              {s.entreprise?.nom || "—"}
                            </span>
                          </span>
                          {s.universite?.nom && (
                            <span>
                              <span className="text-muted-foreground/70">University </span>
                              <span className="text-foreground/80">
                                {s.universite.nom}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="hidden shrink-0 flex-col items-end gap-1.5 sm:flex">
                        <ThinProgress percent={s.progression?.percent} statut={s.statut} />
                        <p className="text-[11px] text-muted-foreground">
                          {formatDepuis(s.derniereActivite, t)}
                        </p>
                      </div>

                      <span className="text-xs font-medium text-primary sm:shrink-0">
                        {t("adminStages.openFile")} →
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {pagination && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Page {pagination.page} / {pagination.totalPages}
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
                    disabled={page >= pagination.totalPages || isFetching}
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

      {/* Case drawer — data from list item only */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.button
              type="button"
              aria-label={t("adminStages.close")}
              className="absolute inset-0 bg-black/30"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label={t("adminStages.fileTitle")}
              initial={reduce ? false : { x: 24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={reduce ? undefined : { x: 24, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-xl"
            >
              <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3.5">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {t("adminStages.fileTitle")}
                  </p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {fileCode(selected)}
                  </p>
                  <h3 className="mt-1 text-base font-semibold leading-snug text-foreground">
                    {selected.intitulePoste || t("adminStages.internship")}
                  </h3>
                  <div className="mt-2">
                    <StatusPill statut={selected.statut} />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                  aria-label={t("adminStages.close")}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4 text-sm">
                <section className="grid gap-3">
                  <MetaRow label={t("adminStages.student")} value={selected.stagiaire?.nomComplet} />
                  <MetaRow label={t("adminStages.company")} value={selected.entreprise?.nom} />
                  <MetaRow label={t("adminStages.university")} value={selected.universite?.nom} />
                </section>

                <section className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                      {t("adminStages.start")}
                    </p>
                    <p className="mt-1 text-foreground">
                      {formatDate(selected.dateDebut, t)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                      {t("adminStages.end")}
                    </p>
                    <p className="mt-1 text-foreground">
                      {formatDate(selected.dateFinPrevue, t)}
                    </p>
                  </div>
                </section>

                <section>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    {t("adminStages.progress")}
                  </p>
                  <div className="mt-2">
                    <ThinProgress percent={selected.progression?.percent} statut={selected.statut} />
                  </div>
                </section>

                <section>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    {t("adminStages.lastActivity")}
                  </p>
                  <p className="mt-1 text-foreground">
                    {formatDepuis(selected.derniereActivite, t)}
                  </p>
                </section>

                {(selected.nbAlertes || 0) > 0 && (
                  <section className="rounded-md border border-border bg-muted/20 px-3 py-2.5">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {t("adminStages.alertsOnFile", { n: selected.nbAlertes })}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {t("adminStages.openFullHint")}
                    </p>
                  </section>
                )}

                <section>
                  <Button asChild type="button" className="w-full gap-1.5">
                    <Link href={`/gestion-stages/${selected.idStage}`}>
                      {t("adminStages.openFullFile")}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </section>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function OverviewStat({ value, label }) {
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

function MetaRow({ label, value }) {
  return (
    <div className="rounded-md border border-border px-3 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-medium text-foreground">
        {value || "—"}
      </p>
    </div>
  );
}
