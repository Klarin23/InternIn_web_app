"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  RefreshCw,
  Download,
  Search,
  Eye,
  Loader2,
  XCircle,
  FileText,
  X,
  ChevronRight,
} from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
import AdminPageHeader from "@/components/layout/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  useAuditJournal,
  useAuditStats,
  useExportAudit,
} from "@/lib/queries/useAuditJournal";

/* ─── Helpers ─────────────────────────────────────────────────────────── */

function formatDateTime(v) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Africa/Douala",
    });
  } catch {
    return String(v);
  }
}

function formatTime(v) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Africa/Douala",
    });
  } catch {
    return String(v);
  }
}


/** Libellé i18n d'une action d'audit (code technique → traduction). */
function translateAuditAction(action, t) {
  if (!action) return t("auditLog.actionFallback");
  const key = `auditLog.actions.${action}`;
  const translated = t(key);
  // useTranslation renvoie souvent la clé si absente
  if (translated && translated !== key) return translated;
  return String(action).replace(/_/g, " ");
}

function translateEntityType(typeEntite, t) {
  if (!typeEntite) return "—";
  const key = `auditLog.entities.${typeEntite}`;
  const translated = t(key);
  if (translated && translated !== key) return translated;
  return String(typeEntite).replace(/_/g, " ");
}

function translateStatusValue(status, t) {
  if (status == null || status === "") return "—";
  const key = `auditLog.statuses.${status}`;
  const translated = t(key);
  if (translated && translated !== key) return translated;
  return String(status);
}

function formatDepuis(iso, t) {
  if (!iso) return "—";
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return t("auditLog.secsAgo", { n: sec });
  const min = Math.floor(sec / 60);
  if (min < 60) return t("auditLog.minsAgo", { n: min });
  return formatDateTime(iso);
}

function shortId(id) {
  if (!id) return "—";
  return String(id).replace(/-/g, "").slice(0, 8).toUpperCase();
}

function SectionLabel({ children }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF] dark:text-muted-foreground">
      {children}
    </p>
  );
}

function CardShell({ children, className }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_1px_2px_rgba(17,24,39,0.04)] dark:border-border dark:bg-card dark:shadow-none",
        className,
      )}
    >
      {children}
    </div>
  );
}

function catLabel(key, t) {
  const map = {
    parametres: t("auditLog.catSettings"),
    securite: t("auditLog.catSecurity"),
    entreprises: t("auditLog.catCompanies"),
    universites: t("auditLog.catUniversities"),
    utilisateurs: t("auditLog.catUsers"),
    offres: t("auditLog.catOffers"),
    conventions: t("auditLog.catConventions"),
    stages: t("auditLog.catInternships"),
    signalements: t("auditLog.catReports"),
    candidatures: t("auditLog.catApplications"),
    entretiens: t("auditLog.catInterviews"),
    authentification: t("auditLog.catAuth"),
    audit: t("auditLog.catAudit"),
    anomalie_controle: t("auditLog.catControl"),
    autre: t("auditLog.catOther"),
  };
  return map[key] || key || "—";
}

/* ─── Page ────────────────────────────────────────────────────────────── */

export default function JournalAuditPage() {
  const reduce = useReducedMotion();
  const { t } = useTranslation();
  const [recherche, setRecherche] = useState("");
  const [periode, setPeriode] = useState("30d");
  const [typeEntite, setTypeEntite] = useState("tous");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [selected, setSelected] = useState(null);
  const [exporting, setExporting] = useState(false);

  const params = useMemo(
    () => ({
      recherche: recherche.trim() || undefined,
      periode,
      typeEntite,
      page,
      limit,
    }),
    [recherche, periode, typeEntite, page, limit],
  );

  const { data, isLoading, isError, error, refetch, isFetching, dataUpdatedAt } =
    useAuditJournal(params);
  const { data: stats } = useAuditStats();
  const { exportEvents } = useExportAudit();

  const events = data?.events || [];
  const pagination = data?.pagination;

  async function handleExport() {
    setExporting(true);
    try {
      const res = await exportEvents({
        recherche: recherche.trim() || undefined,
        periode,
        typeEntite,
      });
      const rows = res?.events || [];
      const headers = [
        t("auditLog.csvDate"),
        t("auditLog.csvAdmin"),
        t("auditLog.csvAction"),
        t("auditLog.csvCategory"),
        t("auditLog.csvEntityType"),
        t("auditLog.csvEntityId"),
        t("auditLog.csvBefore"),
        t("auditLog.csvAfter"),
        t("auditLog.csvReason"),
      ];
      const lines = rows.map((e) =>
        [
          e.dateCreation,
          e.administrateur?.nom || e.administrateur?.email,
          translateAuditAction(e.action, t),
          e.categorie,
          translateEntityType(e.typeEntite, t),
          e.idEntite,
          translateStatusValue(e.ancienStatut, t),
          translateStatusValue(e.nouveauStatut, t),
          e.motif,
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
      a.download = `journal-audit-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
    }
  }

  const ENTITY_TABS = [
    { value: "tous", label: t("auditLog.filterAll") },
    { value: "utilisateur", label: t("auditLog.filterUsers") },
    { value: "entreprise", label: t("auditLog.filterCompanies") },
    { value: "universite", label: t("auditLog.filterUniversities") },
    { value: "parametres", label: t("auditLog.filterSystem") },
    { value: "anomalie_controle", label: t("auditLog.filterControl") },
    { value: "audit", label: t("auditLog.filterAudit") },
  ];

  return (
    <>
      <AppHeader
        breadcrumb={[
          { label: t("auditLog.breadcrumbAdmin") },
          { label: t("auditLog.breadcrumbTraceability") },
        ]}
        refreshKeys={["adminAuditJournal", "adminAuditStats"]}
      />
      <div className="px-4 pt-5 sm:px-6">
        <AdminPageHeader
          context={t("auditLog.headerContext")}
          title={t("auditLog.title")}
          description={t("auditLog.subtitle")}
        />
      </div>


      <div className="min-h-full bg-[#F7F8FA] dark:bg-background">
        <div className="space-y-5 px-4 py-5 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="max-w-xl text-sm text-[#6B7280] dark:text-muted-foreground">
                {t("auditLog.tagline")}
              </p>
              <p className="mt-2 text-xs text-[#9CA3AF]">
                {t("auditLog.lastSync")}{" "}
                <span className="font-medium text-[#111827] dark:text-foreground">
                  {isFetching
                    ? t("auditLog.refreshing")
                    : dataUpdatedAt
                      ? formatDepuis(
                          new Date(dataUpdatedAt).toISOString(),
                          t,
                        )
                      : "—"}
                </span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-[#E5E7EB] bg-white dark:border-border dark:bg-card"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RefreshCw
                  className={cn(
                    "mr-1.5 h-3.5 w-3.5",
                    isFetching && "animate-spin",
                  )}
                />
                {t("auditLog.refresh")}
              </Button>
              <Button
                type="button"
                size="sm"
                className="bg-[#14B8A6] text-white hover:bg-[#0d9488]"
                onClick={handleExport}
                disabled={exporting}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                {exporting ? t("auditLog.exporting") : t("auditLog.export")}
              </Button>
            </div>
          </div>

          {/* Today strip */}
          <CardShell className="overflow-hidden">
            <div className="border-b border-[#E5E7EB] px-5 py-3 dark:border-border sm:px-6">
              <SectionLabel>{t("auditLog.today")}</SectionLabel>
            </div>
            <div className="grid grid-cols-2 divide-x divide-y divide-[#E5E7EB] sm:grid-cols-3 lg:grid-cols-6 dark:divide-border">
              {[
                { label: t("auditLog.kpiToday"), value: stats?.aujourdhui },
                { label: t("auditLog.kpiWeek"), value: stats?.semaine },
                { label: t("auditLog.kpiMonth"), value: stats?.mois },
                {
                  label: t("auditLog.kpiSensitive"),
                  value: stats?.sensibles,
                  warn: (stats?.sensibles ?? 0) > 0,
                },
                {
                  label: t("auditLog.kpiAdmins"),
                  value: stats?.adminsActifs,
                },
                { label: t("auditLog.kpiTotal"), value: stats?.total },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col justify-between px-4 py-4 sm:px-5"
                >
                  <p className="text-[11px] font-medium text-[#9CA3AF]">
                    {item.label}
                  </p>
                  <p
                    className={cn(
                      "mt-2 text-2xl font-semibold tabular-nums tracking-tight",
                      item.warn
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-[#111827] dark:text-foreground",
                    )}
                  >
                    {item.value ?? "—"}
                  </p>
                </div>
              ))}
            </div>
          </CardShell>

          {/* Search + filters */}
          <div className="space-y-3">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                value={recherche}
                onChange={(e) => {
                  setRecherche(e.target.value);
                  setPage(1);
                }}
                placeholder={t("auditLog.searchPlaceholder")}
                className="h-12 w-full rounded-2xl border border-[#E5E7EB] bg-white pl-11 pr-4 text-sm text-[#111827] shadow-[0_1px_2px_rgba(17,24,39,0.04)] outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/30 dark:border-border dark:bg-card dark:text-foreground"
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="flex flex-wrap gap-1.5">
                {ENTITY_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => {
                      setTypeEntite(tab.value);
                      setPage(1);
                    }}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
                      typeEntite === tab.value
                        ? "border-[#14B8A6]/40 bg-[#14B8A6]/10 text-[#0f766e] dark:text-[#14B8A6]"
                        : "border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#F7F8FA] dark:border-border dark:bg-card dark:hover:bg-muted",
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <select
                value={periode}
                onChange={(e) => {
                  setPeriode(e.target.value);
                  setPage(1);
                }}
                className="h-9 rounded-lg border border-[#E5E7EB] bg-white px-2 text-sm dark:border-border dark:bg-card"
              >
                <option value="today">{t("auditLog.periodToday")}</option>
                <option value="7d">{t("auditLog.period7d")}</option>
                <option value="30d">{t("auditLog.period30d")}</option>
                <option value="90d">{t("auditLog.period90d")}</option>
                <option value="year">{t("auditLog.periodYear")}</option>
                <option value="all">{t("auditLog.periodAll")}</option>
              </select>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setRecherche("");
                  setPeriode("30d");
                  setTypeEntite("tous");
                  setPage(1);
                }}
              >
                {t("auditLog.reset")}
              </Button>
            </div>
          </div>

          {/* Activity list */}
          {isLoading ? (
            <div className="flex justify-center py-16 text-[#6B7280]">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-[#14B8A6]" />
              {t("auditLog.loading")}
            </div>
          ) : isError ? (
            <CardShell className="p-8 text-center">
              <XCircle className="mx-auto h-6 w-6 text-red-500" />
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {error?.message || t("auditLog.loadError")}
              </p>
              <Button
                type="button"
                size="sm"
                className="mt-3"
                onClick={() => refetch()}
              >
                {t("auditLog.retry")}
              </Button>
            </CardShell>
          ) : events.length === 0 ? (
            <CardShell className="border-dashed py-14 text-center">
              <FileText className="mx-auto h-8 w-8 text-[#9CA3AF]/60" />
              <p className="mt-3 text-sm font-medium text-[#111827] dark:text-foreground">
                {t("auditLog.emptyTitle")}
              </p>
              <p className="text-xs text-[#6B7280] dark:text-muted-foreground">
                {t("auditLog.emptyDesc")}
              </p>
            </CardShell>
          ) : (
            <>
              <CardShell className="overflow-hidden">
                <div className="border-b border-[#E5E7EB] px-5 py-3 dark:border-border sm:px-6">
                  <SectionLabel>{t("auditLog.activity")}</SectionLabel>
                </div>

                {/* Desktop timeline-style rows */}
                <ul className="hidden divide-y divide-[#E5E7EB] md:block dark:divide-border">
                  {events.map((e) => (
                    <li key={e.idJournal}>
                      <button
                        type="button"
                        onClick={() => setSelected(e)}
                        className="flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-[#F7F8FA]/80 dark:hover:bg-muted/30 sm:px-6"
                      >
                        <div className="w-12 shrink-0 pt-0.5 text-right">
                          <p className="text-xs font-medium tabular-nums text-[#111827] dark:text-foreground">
                            {formatTime(e.dateCreation)}
                          </p>
                        </div>
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#14B8A6]" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium text-[#111827] dark:text-foreground">
                              {e.administrateur?.nom || "—"}
                            </p>
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
                              {catLabel(e.categorie, t)}
                            </span>
                          </div>
                          <p className="mt-0.5 text-sm text-[#6B7280] dark:text-muted-foreground">
                            {translateAuditAction(e.action, t)}
                          </p>
                          <p className="mt-1 text-xs text-[#9CA3AF]">
                            {e.administrateur?.email ||
                              e.administrateur?.role ||
                              "administrateur"}
                            {e.idEntite ? ` · #${shortId(e.idEntite)}` : ""}
                            {(e.ancienStatut || e.nouveauStatut) && (
                              <>
                                {" · "}
                                {t("auditLog.changed")}: {translateStatusValue(e.ancienStatut, t)}{" "}
                                → {translateStatusValue(e.nouveauStatut, t)}
                              </>
                            )}
                          </p>
                        </div>
                        <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 text-xs font-medium text-[#14B8A6]">
                          {t("auditLog.viewDetails")}
                          <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>

                {/* Mobile */}
                <ul className="divide-y divide-[#E5E7EB] md:hidden dark:divide-border">
                  {events.map((e) => (
                    <li key={e.idJournal} className="px-5 py-4">
                      <p className="text-[11px] tabular-nums text-[#9CA3AF]">
                        {formatDateTime(e.dateCreation)}
                      </p>
                      <p className="mt-1 text-sm font-medium text-[#111827] dark:text-foreground">
                        {translateAuditAction(e.action, t)}
                      </p>
                      <p className="mt-0.5 text-xs text-[#6B7280] dark:text-muted-foreground">
                        {e.administrateur?.nom} · {catLabel(e.categorie, t)}
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="mt-3 w-full border-[#E5E7EB]"
                        onClick={() => setSelected(e)}
                      >
                        <Eye className="mr-1 h-3.5 w-3.5" />
                        {t("auditLog.viewDetails")}
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardShell>

              {pagination && (
                <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                  <p className="text-xs text-[#6B7280] dark:text-muted-foreground">
                    {(pagination.page - 1) * pagination.limit + 1}–
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total,
                    )}{" "}
                    {t("auditLog.of")} {pagination.total}{" "}
                    {t("auditLog.events")}
                  </p>
                  <div className="flex items-center gap-2">
                    <select
                      value={limit}
                      onChange={(e) => {
                        setLimit(Number(e.target.value));
                        setPage(1);
                      }}
                      className="h-8 rounded-lg border border-[#E5E7EB] bg-white px-2 text-xs dark:border-border dark:bg-card"
                    >
                      {[50, 100, 250].map((n) => (
                        <option key={n} value={n}>
                          {n} / {t("auditLog.page")}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-[#E5E7EB]"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      {t("auditLog.prev")}
                    </Button>
                    <span className="text-xs tabular-nums text-[#6B7280]">
                      {pagination.page} / {pagination.totalPages}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-[#E5E7EB]"
                      disabled={page >= pagination.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      {t("auditLog.next")}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Detail drawer */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.button
              type="button"
              className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
              aria-label={t("auditLog.close")}
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
            />
            <motion.aside
              initial={reduce ? false : { x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-[#E5E7EB] bg-white shadow-xl dark:border-border dark:bg-card"
            >
              <div className="flex items-start justify-between gap-3 border-b border-[#E5E7EB] p-5 dark:border-border">
                <div className="min-w-0">
                  <SectionLabel>{t("auditLog.eventTitle")}</SectionLabel>
                  <h2 className="mt-1 text-lg font-semibold text-[#111827] dark:text-foreground">
                    {translateAuditAction(selected.action, t)}
                  </h2>
                  <p className="mt-1 font-mono text-[11px] text-[#9CA3AF]">
                    {selected.action}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-lg p-1.5 text-[#9CA3AF] hover:bg-[#F7F8FA] dark:hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto p-5 text-sm">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-[#9CA3AF]">
                    {t("auditLog.admin")}
                  </p>
                  <p className="mt-1 font-medium text-[#111827] dark:text-foreground">
                    {selected.administrateur?.nom}
                  </p>
                  <p className="text-xs text-[#6B7280] dark:text-muted-foreground">
                    {selected.administrateur?.role} ·{" "}
                    {selected.administrateur?.email}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-[#9CA3AF]">
                    {t("auditLog.date")}
                  </p>
                  <p className="mt-1 text-[#111827] dark:text-foreground">
                    {formatDateTime(selected.dateCreation)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-[#9CA3AF]">
                    {t("auditLog.entity")}
                  </p>
                  <p className="mt-1 text-[#111827] dark:text-foreground">
                    {translateEntityType(selected.typeEntite, t)}
                    {selected.idEntite
                      ? ` · #${shortId(selected.idEntite)}`
                      : ""}
                  </p>
                  <p className="text-xs text-[#6B7280]">
                    {catLabel(selected.categorie, t)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-[#9CA3AF]">
                    {t("auditLog.result")}
                  </p>
                  <span className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {t("auditLog.success")}
                  </span>
                </div>
                {(selected.ancienStatut || selected.nouveauStatut) && (
                  <div className="grid grid-cols-2 gap-3 rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] p-3 dark:border-border dark:bg-muted/40">
                    <div>
                      <p className="text-[11px] text-[#9CA3AF]">
                        {t("auditLog.before")}
                      </p>
                      <p className="font-medium text-[#111827] dark:text-foreground">
                        {translateStatusValue(selected.ancienStatut, t)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-[#9CA3AF]">
                        {t("auditLog.after")}
                      </p>
                      <p className="font-medium text-[#111827] dark:text-foreground">
                        {translateStatusValue(selected.nouveauStatut, t)}
                      </p>
                    </div>
                  </div>
                )}
                {selected.motif && (
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-[#9CA3AF]">
                      {t("auditLog.reason")}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-[#6B7280] dark:text-muted-foreground">
                      {selected.motif}
                    </p>
                  </div>
                )}
                <p className="text-[11px] leading-relaxed text-[#9CA3AF]">
                  {t("auditLog.immutable")}
                </p>
              </div>
              <div className="border-t border-[#E5E7EB] p-3 dark:border-border">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setSelected(null)}
                >
                  {t("auditLog.close")}
                </Button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
