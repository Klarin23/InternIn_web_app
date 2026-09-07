"use client";

/**
 * Centre de sécurité — console d'analyse Admin (UI/UX).
 * Données : API existante (overview + comptes à risque). Aucune logique métier locale.
 */

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Shield,
  RefreshCw,
  Loader2,
  Search,
  X,
  ChevronRight,
  MapPin,
  KeyRound,
  CheckCircle2,
  Info,
} from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
import AdminPageHeader from "@/components/layout/AdminPageHeader";
import { Button } from "@/components/ui/button";
import SecurityAlertsPanel from "@/components/features/admin/SecurityAlertsPanel";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  useSecurityOverview,
  useComptesARisque,
  useRevokeUserSessions,
} from "@/lib/queries/useSecurityCentre";

/* ─── helpers ─────────────────────────────────────────────────────────── */

function dateLocale(locale) {
  return locale === "en" ? "en-GB" : "fr-FR";
}

function formatDate(v, locale = "fr") {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString(dateLocale(locale), {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Africa/Douala",
    });
  } catch {
    return String(v);
  }
}

function formatDepuis(iso, t) {
  if (!iso) return "—";
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return t("securityCenter.timeSecondsAgo", { n: Math.max(0, sec) });
  const min = Math.floor(sec / 60);
  if (min < 60) return t("securityCenter.timeMinutesAgo", { n: min });
  const h = Math.floor(min / 60);
  if (h < 24) return t("securityCenter.timeHoursAgo", { n: h });
  return t("securityCenter.timeDaysAgo", { n: Math.floor(h / 24) });
}

/** Ordre de sévérité pour tri / attention */
const NIVEAU_RANK = {
  critique: 6,
  attaque_probable: 5,
  automatisation_probable: 4,
  partage_probable: 3,
  suspect: 2,
  inhabituel: 1,
  attention: 1,
  important: 2,
  normal: 0,
};

const PRIORITY_NIVEAUX = new Set([
  "critique",
  "attaque_probable",
  "automatisation_probable",
  "partage_probable",
]);

function primarySignal(compte, t) {
  const list = compte?.signaux || compte?.whyScore || [];
  if (!list.length) return t("securityCenter.signalNone");
  const sorted = [...list].sort((a, b) => (b.points || 0) - (a.points || 0));
  return sorted[0]?.label || t("securityCenter.signalNone");
}

function riskLabel(score, t) {
  const s = Number(score) || 0;
  if (s >= 80) return t("securityCenter.riskHigh");
  if (s >= 45) return t("securityCenter.riskElevated");
  if (s >= 20) return t("securityCenter.riskModerate");
  return t("securityCenter.riskLow");
}

/* ─── micro-composants UI ─────────────────────────────────────────────── */

function StatusDot({ active }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span
        className={cn(
          "size-1.5 rounded-full",
          active ? "bg-emerald-500" : "bg-muted-foreground/40",
        )}
        aria-hidden
      />
      {active ? null : null}
    </span>
  );
}

function NiveauText({ niveau, t }) {
  const key = `securityCenter.niveau.${niveau}`;
  const label = t(key);
  const tone =
    {
      critique: "text-red-700 dark:text-red-400",
      attaque_probable: "text-zinc-800 dark:text-zinc-200",
      automatisation_probable: "text-violet-700 dark:text-violet-400",
      partage_probable: "text-red-600/90 dark:text-red-400",
      suspect: "text-orange-700 dark:text-orange-400",
      inhabituel: "text-amber-700 dark:text-amber-400",
      important: "text-orange-700 dark:text-orange-400",
      attention: "text-amber-700 dark:text-amber-400",
      normal: "text-muted-foreground",
    }[niveau] || "text-muted-foreground";

  return (
    <span className={cn("text-xs font-medium", tone)}>
      {label === key ? niveau : label}
    </span>
  );
}

function ScoreBar({ value, className }) {
  const v = Math.min(100, Math.max(0, Number(value) || 0));
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className="h-1 w-16 overflow-hidden rounded-full bg-muted sm:w-20"
        role="meter"
        aria-valuenow={v}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            v >= 80 ? "bg-red-500" : v >= 45 ? "bg-orange-500" : v >= 20 ? "bg-amber-500" : "bg-emerald-500",
          )}
          style={{ width: `${v}%` }}
        />
      </div>
      <span className="tabular-nums text-xs font-medium text-foreground">{Math.round(v)}</span>
    </div>
  );
}

function StatCell({ value, label, hint, emphasize }) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col border-border px-3 py-3 sm:px-4",
        "border-b sm:border-b-0 sm:border-r last:border-b-0 last:sm:border-r-0",
      )}
    >
      <p
        className={cn(
          "text-2xl font-semibold tracking-tight tabular-nums",
          emphasize && "text-foreground",
        )}
      >
        {value}
      </p>
      <p className="mt-0.5 text-xs font-medium text-foreground/80">{label}</p>
      {hint ? (
        <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function SkeletonBlock({ className }) {
  return <div className={cn("animate-pulse rounded-md bg-muted/70", className)} />;
}

/* ─── page ────────────────────────────────────────────────────────────── */

export default function CentreSecuritePage() {
  const { t, locale } = useTranslation();
  const reduce = useReducedMotion();
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("risk_desc");
  const [selected, setSelected] = useState(null);
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [refreshedAt, setRefreshedAt] = useState(() => new Date());

  const overview = useSecurityOverview();
  const comptesQ = useComptesARisque();
  const revokeAll = useRevokeUserSessions();

  const loading = overview.isLoading || comptesQ.isLoading;
  const refreshing = overview.isFetching || comptesQ.isFetching;
  const error = overview.isError || comptesQ.isError;

  const ov = overview.data || {};
  const suspect = ov.activiteSuspecte || ov.suspectStats || {};
  const statsUnavailable = suspect.status === "unavailable";
  const comptes = Array.isArray(comptesQ.data) ? comptesQ.data : [];

  // KPI globaux — strictement issus de /overview (jamais de la liste paginée)
  const nNormal = Number(suspect.normal ?? 0);
  const nInhab = Number(suspect.inhabituels ?? 0);
  const nSuspect = Number(suspect.suspects ?? 0);
  const nPartage = Number(suspect.partage ?? 0);
  const nAuto = Number(suspect.automatisation ?? 0);
  const nCritique = Number(suspect.critiques ?? 0);
  const nAttaque = Number(suspect.attaque ?? 0);
  const nNonAnalyzed = Number(suspect.nonAnalyzedAccounts ?? 0);
  const nAnalyzed = Number(suspect.analyzedAccounts ?? 0);
  // Attention = somme des niveaux prioritaires (contrat API), pas filter client sur page limitée
  const nAttention =
    nPartage + nAuto + nAttaque + nCritique + nSuspect;

  const filtered = useMemo(() => {
    let list = [...comptes];
    if (filter === "watch") {
      list = list.filter((c) => NIVEAU_RANK[c.niveau] >= 2);
    } else if (filter !== "all") {
      list = list.filter(
        (c) => c.niveau === filter || c.niveauLegacy === filter,
      );
    }
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter(
        (c) =>
          (c.email || "").toLowerCase().includes(s) ||
          (c.typeUtilisateur || "").toLowerCase().includes(s) ||
          (c.idUtilisateur || "").toLowerCase().includes(s),
      );
    }
    list.sort((a, b) => {
      if (sort === "risk_asc")
        return (a.scoreGlobal ?? a.score ?? 0) - (b.scoreGlobal ?? b.score ?? 0);
      if (sort === "activity") {
        const da = new Date(a.derniereConnexion || 0).getTime();
        const db = new Date(b.derniereConnexion || 0).getTime();
        return db - da;
      }
      // risk_desc default
      const rd =
        (b.scoreGlobal ?? b.score ?? 0) - (a.scoreGlobal ?? a.score ?? 0);
      if (rd !== 0) return rd;
      return (NIVEAU_RANK[b.niveau] || 0) - (NIVEAU_RANK[a.niveau] || 0);
    });
    return list;
  }, [comptes, filter, q, sort]);

  const priorityItems = useMemo(
    () =>
      comptes
        .filter((c) => PRIORITY_NIVEAUX.has(c.niveau))
        .sort(
          (a, b) =>
            (b.scoreGlobal ?? b.score ?? 0) - (a.scoreGlobal ?? a.score ?? 0),
        )
        .slice(0, 5),
    [comptes],
  );

  const handleRefresh = useCallback(async () => {
    await Promise.all([overview.refetch(), comptesQ.refetch()]);
    setRefreshedAt(new Date());
  }, [overview, comptesQ]);

  async function handleRevokeAll() {
    if (!selected?.idUtilisateur) return;
    await revokeAll.mutateAsync(selected.idUtilisateur);
    setConfirmRevoke(false);
    setSelected(null);
    comptesQ.refetch();
  }

  const filters = [
    { id: "all", label: t("securityCenter.filterAll") },
    { id: "watch", label: t("securityCenter.filterWatch") },
    { id: "partage_probable", label: t("securityCenter.niveau.partage_probable") },
    { id: "automatisation_probable", label: t("securityCenter.niveau.automatisation_probable") },
    { id: "attaque_probable", label: t("securityCenter.niveau.attaque_probable") },
    { id: "critique", label: t("securityCenter.niveau.critique") },
  ];

  return (
    <div className="min-h-full bg-[#F7F8FA] dark:bg-background">
      <AppHeader
        breadcrumb={[
          { label: t("securityCenter.breadcrumbAdmin", "Admin") },
          { label: t("securityCenter.title") },
        ]}
        refreshKeys={["adminSecurityOverview", "adminComptesARisque"]}
      />
      <main className="w-full px-4 py-5 sm:px-6 lg:px-8">
        <AdminPageHeader
          context={t("securityCenter.headerContext")}
          title={t("securityCenter.title")}
          description={t("securityCenter.subtitlePremium")}
          status={
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
              {t("securityCenter.monitoringActive")}
            </span>
          }
          metadata={
            <span className="text-xs text-muted-foreground">
              {t("securityCenter.lastAnalysis")} · {formatDepuis(refreshedAt.toISOString(), t)}
            </span>
          }
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              aria-label={t("securityCenter.refresh")}
            >
              {refreshing ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
              <span className="ml-2">{t("securityCenter.refresh")}</span>
            </Button>
          }
        />

        {error && (
          <div
            className="mt-4 rounded-lg border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm"
            role="alert"
          >
            <p className="font-medium text-destructive">{t("securityCenter.loadError")}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("securityCenter.loadErrorHint")}</p>
            <Button variant="ghost" size="sm" className="mt-2 h-8 px-2" onClick={handleRefresh}>
              {t("securityCenter.retry")}
            </Button>
          </div>
        )}

        
        {/* Centre d'alertes */}
        <div className="mt-4">
          <SecurityAlertsPanel />
        </div>

        {statsUnavailable && !error && (
          <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm" role="status">
            <p className="font-medium text-amber-800 dark:text-amber-200">{t("securityCenter.statsUnavailable")}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("securityCenter.statsUnavailableHint")}</p>
          </div>
        )}

        {/* KPI band — compact, no card explosion */}
        <section className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
          {loading ? (
            <div className="flex gap-2 p-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <SkeletonBlock key={i} className="h-16 flex-1" />
              ))}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row">
              <StatCell
                value={statsUnavailable ? "—" : nNormal}
                label={t("securityCenter.kpiNormalLabel")}
                hint={t("securityCenter.kpiNormalHint")}
              />
              <StatCell
                value={statsUnavailable ? "—" : nInhab}
                label={t("securityCenter.kpiUnusualLabel")}
                hint={t("securityCenter.kpiUnusualHint")}
              />
              <StatCell
                value={statsUnavailable ? "—" : nSuspect}
                label={t("securityCenter.kpiSuspectLabel")}
                hint={t("securityCenter.kpiSuspectHint")}
              />
              <StatCell
                value={statsUnavailable ? "—" : nPartage}
                label={t("securityCenter.kpiSharingLabel")}
                hint={t("securityCenter.kpiSharingHint")}
                emphasize={nPartage > 0}
              />
              <StatCell
                value={statsUnavailable ? "—" : nAuto + nAttaque + nCritique}
                label={t("securityCenter.kpiAutoLabel")}
                hint={t("securityCenter.kpiAutoHint")}
                emphasize={nAuto + nCritique > 0}
              />
            </div>
          )}
        </section>
        {!loading && !statsUnavailable && (nAnalyzed > 0 || nNonAnalyzed > 0) && (
          <p className="mt-2 text-[11px] text-muted-foreground">
            {t("securityCenter.analyzedMeta", { analyzed: nAnalyzed, nonAnalyzed: nNonAnalyzed })}
          </p>
        )}


        {/* À votre attention */}
        {!loading && nAttention > 0 && (
          <section className="mt-6 rounded-xl border border-border bg-card px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {t("securityCenter.attentionTitle", { n: nAttention })}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {nPartage > 0 && (
                    <span>
                      {t("securityCenter.attentionSharing", { n: nPartage })}
                      {(nAuto > 0 || nCritique > 0) ? " · " : ""}
                    </span>
                  )}
                  {(nAuto > 0 || nCritique > 0) &&
                    t("securityCenter.attentionAuto", { n: nAuto + nCritique })}
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setFilter("watch")}
              >
                {t("securityCenter.viewAlerts")}
              </Button>
            </div>
            {priorityItems.length > 0 && (
              <ul className="mt-4 divide-y divide-border border-t border-border">
                {priorityItems.slice(0, 3).map((c) => (
                  <li key={c.idUtilisateur}>
                    <button
                      type="button"
                      onClick={() => setSelected(c)}
                      className="flex w-full items-center justify-between gap-3 py-3 text-left transition-colors hover:bg-muted/40"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{c.email}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          <NiveauText niveau={c.niveau} t={t} />
                          <span className="text-muted-foreground/50"> · </span>
                          {primarySignal(c, t)}
                        </p>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary">
                        {t("securityCenter.examine")}
                        <ChevronRight className="size-3.5" />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* Pédagogie discrète */}
        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            { n: "01", title: t("securityCenter.howObserveTitle"), body: t("securityCenter.howObserveBody") },
            { n: "02", title: t("securityCenter.howDetectTitle"), body: t("securityCenter.howDetectBody") },
            { n: "03", title: t("securityCenter.howAssessTitle"), body: t("securityCenter.howAssessBody") },
          ].map((step) => (
            <div key={step.n} className="rounded-lg border border-border/80 px-3 py-3">
              <p className="text-[10px] font-semibold tracking-wider text-muted-foreground">
                {step.n}
              </p>
              <p className="mt-1 text-xs font-medium text-foreground">{step.title}</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </section>

        {/* Liste */}
        <section className="mt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                {t("securityCenter.watchedAccounts")}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("securityCenter.watchedAccountsHint")}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[180px] flex-1 sm:flex-none">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setQ("");
                  }}
                  placeholder={t("securityCenter.searchPlaceholder")}
                  className="h-9 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring sm:w-56"
                  aria-label={t("securityCenter.searchPlaceholder")}
                />
              </div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="h-9 rounded-lg border border-border bg-background px-2 text-xs"
                aria-label={t("securityCenter.sortLabel")}
              >
                <option value="risk_desc">{t("securityCenter.sortRiskDesc")}</option>
                <option value="risk_asc">{t("securityCenter.sortRiskAsc")}</option>
                <option value="activity">{t("securityCenter.sortActivity")}</option>
              </select>
            </div>
          </div>

          <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  filter === f.id
                    ? "bg-foreground text-background"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
            {loading ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3, 4].map((i) => (
                  <SkeletonBlock key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <CheckCircle2 className="mx-auto size-7 text-emerald-600/80" />
                <p className="mt-3 text-sm font-medium">{t("securityCenter.emptyTitle")}</p>
                <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                  {t("securityCenter.emptyBody")}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop table header */}
                <div className="hidden border-b border-border bg-muted/30 px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground md:grid md:grid-cols-[minmax(0,1.4fr)_110px_minmax(0,1.2fr)_90px_100px_88px] md:gap-3">
                  <span>{t("securityCenter.colUser")}</span>
                  <span>{t("securityCenter.colLevel")}</span>
                  <span>{t("securityCenter.colSignal")}</span>
                  <span>{t("securityCenter.colScore")}</span>
                  <span>{t("securityCenter.colActivity")}</span>
                  <span className="text-right">{t("securityCenter.colAction")}</span>
                </div>
                <ul className="divide-y divide-border">
                  {filtered.map((c) => {
                    const score = c.scoreGlobal ?? c.score ?? 0;
                    return (
                      <li key={c.idUtilisateur}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelected(c);
                            setConfirmRevoke(false);
                          }}
                          className="w-full px-4 py-3.5 text-left transition-colors hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                        >
                          {/* Mobile card */}
                          <div className="md:hidden">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">{c.email}</p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  {c.typeUtilisateur || "—"}
                                </p>
                              </div>
                              <NiveauText niveau={c.niveau} t={t} />
                            </div>
                            <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                              {primarySignal(c, t)}
                            </p>
                            <div className="mt-2 flex items-center justify-between">
                              <ScoreBar value={score} />
                              <span className="text-[11px] text-muted-foreground">
                                {formatDepuis(c.derniereConnexion, t)}
                              </span>
                            </div>
                          </div>
                          {/* Desktop row */}
                          <div className="hidden md:grid md:grid-cols-[minmax(0,1.4fr)_110px_minmax(0,1.2fr)_90px_100px_88px] md:items-center md:gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{c.email}</p>
                              <p className="truncate text-[11px] text-muted-foreground">
                                {c.typeUtilisateur || "—"}
                              </p>
                            </div>
                            <NiveauText niveau={c.niveau} t={t} />
                            <p className="line-clamp-2 text-xs text-muted-foreground">
                              {primarySignal(c, t)}
                            </p>
                            <ScoreBar value={score} />
                            <span className="text-xs text-muted-foreground">
                              {formatDepuis(c.derniereConnexion, t)}
                            </span>
                            <span className="inline-flex items-center justify-end gap-0.5 text-xs font-medium text-primary">
                              {t("securityCenter.examine")}
                              <ChevronRight className="size-3.5" />
                            </span>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        </section>

        {/* Investigation panel */}
        <AnimatePresence>
          {selected && (
            <motion.div
              className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-stretch sm:justify-end"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setSelected(null);
                setConfirmRevoke(false);
              }}
            >
              <motion.aside
                initial={reduce ? false : { x: "100%", y: 40 }}
                animate={{ x: 0, y: 0 }}
                exit={reduce ? undefined : { x: "100%" }}
                transition={{ type: "spring", stiffness: 380, damping: 36 }}
                className="flex max-h-[92vh] w-full max-w-md flex-col rounded-t-2xl border border-border bg-background shadow-xl sm:max-h-none sm:rounded-none sm:border-l sm:border-t-0"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label={t("securityCenter.investigation")}
              >
                <div className="flex items-start justify-between border-b border-border px-5 py-4">
                  <div className="min-w-0 pr-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {t("securityCenter.investigation")}
                    </p>
                    <p className="mt-1 break-all text-sm font-semibold">{selected.email}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <NiveauText niveau={selected.niveau} t={t} />
                      {selected.confiance && (
                        <span className="text-[11px] text-muted-foreground">
                          {t(`securityCenter.confiance.${selected.confiance}`)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => {
                      setSelected(null);
                      setConfirmRevoke(false);
                    }}
                    aria-label={t("securityCenter.close")}
                  >
                    <X className="size-4" />
                  </Button>
                </div>

                <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
                  {/* Risk */}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-medium text-muted-foreground">
                        {t("securityCenter.riskScore")}
                      </p>
                      <span
                        className="text-muted-foreground"
                        title={t("securityCenter.riskScoreTooltip")}
                      >
                        <Info className="size-3" aria-hidden />
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-3xl font-semibold tabular-nums">
                        {selected.scoreGlobal ?? selected.score ?? 0}
                      </span>
                      <span className="text-sm text-muted-foreground">/ 100</span>
                      <span className="ml-1 text-xs text-muted-foreground">
                        {riskLabel(selected.scoreGlobal ?? selected.score, t)}
                      </span>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-foreground/80 transition-all"
                        style={{
                          width: `${Math.min(100, selected.scoreGlobal ?? selected.score ?? 0)}%`,
                        }}
                      />
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
                      <div className="rounded-md border border-border px-2 py-2">
                        <p className="font-semibold tabular-nums">
                          {selected.scorePartageCompte ?? 0}
                        </p>
                        <p className="text-muted-foreground">{t("securityCenter.sharingScore")}</p>
                      </div>
                      <div className="rounded-md border border-border px-2 py-2">
                        <p className="font-semibold tabular-nums">
                          {selected.scoreAutomatisation ?? 0}
                        </p>
                        <p className="text-muted-foreground">{t("securityCenter.automationScore")}</p>
                      </div>
                      <div className="rounded-md border border-border px-2 py-2">
                        <p className="font-semibold tabular-nums">
                          {selected.scoreAuthentification ?? 0}
                        </p>
                        <p className="text-muted-foreground">{t("securityCenter.authScore")}</p>
                      </div>
                    </div>
                  </div>

                  {/* Why */}
                  <div>
                    <h3 className="text-sm font-semibold">{t("securityCenter.whyScore")}</h3>
                    <ul className="mt-2 space-y-1.5">
                      {(selected.whyScore || selected.signaux || []).length === 0 ? (
                        <li className="text-xs text-muted-foreground">
                          {t("securityCenter.signalNone")}
                        </li>
                      ) : (
                        (selected.whyScore || selected.signaux || []).map((s) => (
                          <li
                            key={s.code + String(s.label)}
                            className="flex items-start justify-between gap-3 rounded-md border border-border/60 px-3 py-2 text-sm"
                          >
                            <span className="text-xs leading-snug text-muted-foreground">
                              {s.label}
                            </span>
                            <span className="shrink-0 text-xs font-semibold tabular-nums">
                              +{s.points ?? 0}
                            </span>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>

                  {/* IP stats */}
                  {selected.ipStats && selected.ipStats.multiAccountsSameIp > 1 && (
                    <div className="rounded-md border border-border px-3 py-3 text-xs">
                      <p className="font-medium">{t("securityCenter.ipStatsTitle")}</p>
                      <ul className="mt-2 space-y-1 text-muted-foreground">
                        <li>
                          {t("securityCenter.ipStatsAccounts", {
                            n: selected.ipStats.multiAccountsSameIp,
                          })}
                        </li>
                        <li>
                          {t("securityCenter.ipStatsSuccess", {
                            n: selected.ipStats.successfulAccountsByIp || 0,
                          })}
                        </li>
                        <li>
                          {t("securityCenter.ipStatsFailures", {
                            n: selected.ipStats.failedAttemptsByIp || 0,
                          })}
                        </li>
                      </ul>
                    </div>
                  )}

                  {/* Timeline */}
                  <div>
                    <h3 className="text-sm font-semibold">{t("securityCenter.timeline")}</h3>
                    <ol className="relative mt-3 space-y-4 border-l border-border pl-4">
                      {(selected.timeline || selected.connexions || []).length === 0 ? (
                        <p className="text-xs text-muted-foreground">{t("securityCenter.noTimeline")}</p>
                      ) : (
                        (selected.timeline || selected.connexions || [])
                          .slice(0, 12)
                          .map((ev, idx) => {
                            const isFail =
                              ev.type === "login_failure" ||
                              ev.type === "echec_login";
                            return (
                              <li key={idx} className="relative">
                                <span
                                  className={cn(
                                    "absolute -left-[21px] top-1 size-2 rounded-full ring-4 ring-background",
                                    isFail ? "bg-red-500" : "bg-foreground/70",
                                  )}
                                />
                                <p className="text-[11px] text-muted-foreground">
                                  {formatDate(ev.at || ev.timestamp || ev.dateConnexion, locale)}
                                </p>
                                <p className="text-sm">
                                  {isFail
                                    ? t("securityCenter.eventFailedLogin")
                                    : t("securityCenter.eventLogin")}
                                </p>
                                {(ev.ip ||
                                  ev.lieu ||
                                  ev.location ||
                                  ev.villeConnexion) && (
                                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                                    <MapPin className="size-3 shrink-0" />
                                    <span>
                                      {ev.location ||
                                        ev.lieu ||
                                        [ev.villeConnexion, ev.paysConnexion]
                                          .filter(Boolean)
                                          .join(", ") ||
                                        "—"}
                                      {ev.ip ? ` · ${ev.ip}` : ""}
                                    </span>
                                  </p>
                                )}
                              </li>
                            );
                          })
                      )}
                    </ol>
                  </div>
                </div>

                <div className="space-y-2 border-t border-border p-4">
                  {!confirmRevoke ? (
                    <>
                      <Button
                        variant="destructive"
                        className="w-full"
                        disabled={revokeAll.isPending}
                        onClick={() => setConfirmRevoke(true)}
                      >
                        <KeyRound className="mr-2 size-4" />
                        {t("securityCenter.revokeAllSessions")}
                      </Button>
                      <Button variant="outline" className="w-full" asChild>
                        <Link
                          href={`/utilisateurs?q=${encodeURIComponent(selected.email || "")}`}
                        >
                          {t("securityCenter.viewAccount")}
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                      <p className="text-sm font-medium">
                        {t("securityCenter.confirmRevokeAll")}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t("securityCenter.confirmRevokeAllHint")}
                      </p>
                      <div className="mt-3 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setConfirmRevoke(false)}
                        >
                          {t("securityCenter.cancel")}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex-1"
                          disabled={revokeAll.isPending}
                          onClick={handleRevokeAll}
                        >
                          {revokeAll.isPending ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            t("securityCenter.revokeSessions")
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
