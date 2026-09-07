"use client";

import AppHeader from "@/components/layout/AppHeader";
import AdminPageHeader from "@/components/layout/AdminPageHeader";
import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  RefreshCw,
  Search,
  AlertTriangle,
  ShieldCheck,
  Activity,
  Eye,
  Loader2,
  CheckCircle2,
  XCircle,
  Settings2,
  X,
  ChevronRight,
  Users,
  FileWarning,
  Building2,
  GraduationCap,
} from "lucide-react";
import {
  useControleCentre,
  useResolveAnomalieControle,
} from "@/lib/queries/useControleCentre";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ─── Constants & helpers (logique métier inchangée) ───────────────────── */

const PRIORITE_BADGE = {
  critique:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-400",
  important:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-400",
  attention:
    "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/40 dark:text-sky-400",
  information:
    "border-[#E5E7EB] bg-[#F7F8FA] text-[#6B7280] dark:border-border dark:bg-muted dark:text-muted-foreground",
};

const PRIORITE_DOT = {
  critique: "bg-red-500",
  important: "bg-amber-500",
  attention: "bg-sky-500",
  information: "bg-[#9CA3AF]",
};

const SANTE = {
  bon: {
    labelKey: "controlCenter.statusOperational",
    className: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  attention: {
    labelKey: "controlCenter.statusAttention",
    className: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  critique: {
    labelKey: "controlCenter.statusCritical",
    className: "text-red-600 dark:text-red-400",
    dot: "bg-red-500",
  },
};

const CAT_LABEL_KEYS = {
  stages: "controlCenter.categoryInternships",
  conventions: "controlCenter.categoryConventions",
  activite: "controlCenter.categoryActivity",
  objectifs: "controlCenter.categoryGoals",
  taches: "controlCenter.categoryTasks",
  evaluations: "controlCenter.categoryEvaluations",
  entreprises: "controlCenter.categoryCompanies",
  utilisateurs: "controlCenter.categoryUsers",
  coherence: "controlCenter.categoryDataConsistency",
  securite: "controlCenter.categorySecurity",
};

const PRIORITE_LABEL_KEYS = {
  critique: "controlCenter.critical",
  important: "controlCenter.important",
  attention: "controlCenter.watch",
  information: "controlCenter.info",
};

function formatDepuis(iso, t) {
  if (!iso) return "—";
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return t("controlCenter.timeJustNow");
  if (min < 60) return t("controlCenter.timeMinAgo", { n: min });
  const h = Math.floor(min / 60);
  if (h < 24) return t("controlCenter.timeHoursAgo", { n: h });
  return t("controlCenter.timeDaysAgo", { n: Math.floor(h / 24) });
}

function greetingKey() {
  const h = new Date().getHours();
  if (h < 12) return "controlCenter.greetingMorning";
  if (h < 18) return "controlCenter.greetingAfternoon";
  return "controlCenter.greetingEvening";
}

function SectionLabel({ children, className }) {
  return (
    <p
      className={cn(
        "text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF] dark:text-muted-foreground",
        className,
      )}
    >
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

/* ─── Page ────────────────────────────────────────────────────────────── */

export default function CentreControlePage() {
  const reduce = useReducedMotion();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const adminName =
    user?.prenom || user?.nom || user?.email?.split("@")[0] || "Admin";

  const [recherche, setRecherche] = useState("");
  const [categorie, setCategorie] = useState("toutes");
  const [priorite, setPriorite] = useState("toutes");
  const [statut, setStatut] = useState("ouvertes");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  const params = useMemo(
    () => ({
      recherche: recherche.trim() || undefined,
      categorie,
      priorite,
      statut,
      page,
      limit: 20,
    }),
    [recherche, categorie, priorite, statut, page],
  );

  const { data, isLoading, isError, error, refetch, isFetching, dataUpdatedAt } =
    useControleCentre(params);
  const resolveMut = useResolveAnomalieControle();

  const sante = SANTE[data?.sante?.statut] || SANTE.bon;
  const cats = Object.entries(data?.parCategorie || {}).sort(
    (a, b) => b[1] - a[1],
  );
  const maxCat = Math.max(1, ...cats.map(([, n]) => n));

  function catLabel(cat) {
    const key = CAT_LABEL_KEYS[cat];
    return key ? t(key) : cat;
  }

  function prioriteLabel(priorite) {
    const key = PRIORITE_LABEL_KEYS[priorite];
    return key ? t(key) : priorite;
  }

  function handleResolve(action) {
    if (!selected) return;
    resolveMut.mutate(
      { fingerprint: selected.id, action, note: note.trim() || undefined },
      {
        onSuccess: () => {
          setSelected(null);
          setNote("");
        },
      },
    );
  }

  const lastUpdated = data?.analyseLe
    ? formatDepuis(data.analyseLe, t)
    : dataUpdatedAt
      ? formatDepuis(new Date(dataUpdatedAt).toISOString(), t)
      : "—";

  return (
    <>
      <AppHeader
        breadcrumb={[
          { label: t("controlCenter.breadcrumbAdmin") },
          { label: t("controlCenter.breadcrumbControl") },
        ]}
        refreshKeys={["adminControleCentre"]}
      />
      <div className="px-4 pt-5 sm:px-6">
        <AdminPageHeader
          context={t("controlCenter.headerContext")}
          title={t("controlCenter.title")}
          description={t("controlCenter.subtitle")}
        />
      </div>


      <div className="min-h-full bg-[#F7F8FA] dark:bg-background">
        <div className="space-y-5 px-4 py-5 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm text-[#6B7280] dark:text-muted-foreground">
                {t(greetingKey())}, {adminName}.
                <span className="hidden sm:inline">
                  {" "}
                  {t("controlCenter.greetingLine")}
                </span>
              </p>
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6B7280] dark:text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span className={cn("h-1.5 w-1.5 rounded-full", sante.dot)} />
                  {t("controlCenter.platformStatus")}{" "}
                  <span className={cn("font-medium", sante.className)}>
                    {t(sante.labelKey)}
                  </span>
                </span>
                <span className="text-[#D1D5DB]">·</span>
                <span>
                  {t("controlCenter.lastUpdated")}{" "}
                  <span className="font-medium text-[#111827] dark:text-foreground">
                    {isFetching ? t("controlCenter.scanning") : lastUpdated}
                  </span>
                </span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-[#E5E7EB] bg-white dark:border-border dark:bg-card"
                onClick={() => setShowSettings((v) => !v)}
              >
                <Settings2 className="mr-1.5 h-3.5 w-3.5" />
                {t("controlCenter.detectionSettings")}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
                className="bg-[#14B8A6] text-white hover:bg-[#0d9488]"
              >
                <RefreshCw
                  className={cn(
                    "mr-1.5 h-3.5 w-3.5",
                    isFetching && "animate-spin",
                  )}
                />
                {t("controlCenter.refresh")}
              </Button>
            </div>
          </div>

          {showSettings && (
            <CardShell className="p-4 text-sm">
              <SectionLabel>{t("controlCenter.activeThresholds")}</SectionLabel>
              <ul className="mt-3 space-y-1.5 text-[#6B7280] dark:text-muted-foreground">
                <li>
                  {t("controlCenter.thresholdInactivity")}:{" "}
                  <strong className="text-[#111827] dark:text-foreground">
                    {data?.seuils?.inactiviteJours ?? 7} {t("controlCenter.days")}
                  </strong>
                </li>
                <li>
                  {t("controlCenter.thresholdEnding")}:{" "}
                  <strong className="text-[#111827] dark:text-foreground">
                    {data?.seuils?.finProcheJours ?? 7} {t("controlCenter.days")}
                  </strong>
                </li>
                <li>
                  {t("controlCenter.thresholdGoals")}:{" "}
                  <strong className="text-[#111827] dark:text-foreground">
                    {data?.seuils?.objectifsSansProgressionJours ?? 14} {t("controlCenter.days")}
                  </strong>
                </li>
              </ul>
              <p className="mt-2 text-xs text-[#9CA3AF]">
                {t("controlCenter.thresholdsHint")}
              </p>
            </CardShell>
          )}

          {/* {t("controlCenter.platformPulse")} — unified strip, no colored bars */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <CardShell className="overflow-hidden">
              <div className="border-b border-[#E5E7EB] px-5 py-3 dark:border-border sm:px-6">
                <SectionLabel>{t("controlCenter.platformPulse")}</SectionLabel>
              </div>
              <div className="grid grid-cols-2 divide-x divide-y divide-[#E5E7EB] sm:grid-cols-3 lg:grid-cols-6 dark:divide-border">
                {[
                  {
                    label: t("controlCenter.critical"),
                    value: data?.stats?.critique,
                    critical: (data?.stats?.critique ?? 0) > 0,
                  },
                  {
                    label: t("controlCenter.important"),
                    value: data?.stats?.important,
                    warn: (data?.stats?.important ?? 0) > 0,
                  },
                  {
                    label: t("controlCenter.watch"),
                    value: data?.stats?.attention,
                  },
                  {
                    label: t("controlCenter.info"),
                    value: data?.stats?.information,
                  },
                  {
                    label: t("controlCenter.internships"),
                    value: data?.stats?.stagesConcernes,
                  },
                  {
                    label: t("controlCenter.open"),
                    value: data?.stats?.ouvertes,
                    warn: (data?.stats?.ouvertes ?? 0) > 0,
                  },
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
                        item.critical
                          ? "text-red-600 dark:text-red-400"
                          : item.warn
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-[#111827] dark:text-foreground",
                      )}
                    >
                      {item.value ?? "—"}
                    </p>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#E5E7EB] px-5 py-3 dark:border-border sm:px-6">
                <p className="text-xs text-[#6B7280] dark:text-muted-foreground">
                  <span className="font-medium text-[#111827] dark:text-foreground">
                    {data?.sante?.stagesSurveilles ?? "—"}
                  </span>{" "}
                  {t("controlCenter.monitored")}
                  {" · "}
                  <span className="font-medium text-[#111827] dark:text-foreground">
                    {data?.sante?.situations ?? 0}
                  </span>{" "}
                  {t("controlCenter.situationsNeed")}
                </p>
              </div>
            </CardShell>
          </motion.div>

          {/* Priority feed + Quick actions + System health */}
          <div className="grid gap-4 lg:grid-cols-5">
            {/* Priority / platform activity */}
            <CardShell className="lg:col-span-3">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-3 dark:border-border sm:px-6">
                <SectionLabel>{t("controlCenter.priorityQueue")}</SectionLabel>
                <a
                  href="#liste-anomalies"
                  className="text-[11px] font-medium text-[#14B8A6] hover:underline"
                >
                  {t("controlCenter.viewAll")}
                </a>
              </div>
              <div className="px-5 py-2 sm:px-6">
                {!data?.priorite?.length ? (
                  <div className="flex items-start gap-3 py-6">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-emerald-500" />
                    <div>
                      <p className="text-sm font-medium text-[#111827] dark:text-foreground">
                        {t("controlCenter.allCompliant")}
                      </p>
                      <p className="mt-0.5 text-xs text-[#6B7280] dark:text-muted-foreground">
                        {t("controlCenter.noOpenAnomalies")}
                      </p>
                    </div>
                  </div>
                ) : (
                  <ul>
                    {data.priorite.map((a) => (
                      <li
                        key={a.id}
                        className="flex items-start gap-3 border-b border-[#E5E7EB] py-3.5 last:border-0 dark:border-border"
                      >
                        <span
                          className={cn(
                            "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                            PRIORITE_DOT[a.priorite],
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[#111827] dark:text-foreground">
                            {a.titre}
                          </p>
                          <p className="mt-0.5 text-xs text-[#6B7280] dark:text-muted-foreground">
                            {a.stage?.code}
                            {a.entreprise?.nom ? ` · ${a.entreprise.nom}` : ""}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelected(a)}
                          className="mt-0.5 inline-flex shrink-0 items-center gap-0.5 text-[11px] font-medium text-[#14B8A6] hover:underline"
                        >
                          {t("controlCenter.view")}
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardShell>

            {/* {t("controlCenter.quickActions")} + system health */}
            <div className="flex flex-col gap-4 lg:col-span-2">
              <CardShell>
                <div className="border-b border-[#E5E7EB] px-5 py-3 dark:border-border">
                  <SectionLabel>{t("controlCenter.quickActions")}</SectionLabel>
                </div>
                <ul className="divide-y divide-[#E5E7EB] dark:divide-border">
                  {[
                    {
                      href: "/utilisateurs",
                      label: t("controlCenter.manageUsers"),
                      icon: Users,
                    },
                    {
                      href: "/gestion-entreprises",
                      label: t("controlCenter.reviewCompanies"),
                      icon: Building2,
                    },
                    {
                      href: "/gestion-universites",
                      label: t("controlCenter.universities"),
                      icon: GraduationCap,
                    },
                    {
                      href: "/centre-securite",
                      label: t("controlCenter.securityCenter"),
                      icon: ShieldCheck,
                    },
                    {
                      href: "/journal-audit",
                      label: t("controlCenter.auditLog"),
                      icon: FileWarning,
                    },
                    {
                      href: "/parametres-admin",
                      label: t("controlCenter.platformSettings"),
                      icon: Settings2,
                    },
                  ].map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="flex items-center gap-3 px-5 py-2.5 text-sm text-[#111827] transition-colors hover:bg-[#F7F8FA] dark:text-foreground dark:hover:bg-muted/40"
                      >
                        <item.icon className="h-4 w-4 text-[#9CA3AF]" />
                        <span className="flex-1 font-medium">{item.label}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-[#D1D5DB]" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardShell>

              <CardShell>
                <div className="border-b border-[#E5E7EB] px-5 py-3 dark:border-border">
                  <SectionLabel>{t("controlCenter.systemHealth")}</SectionLabel>
                </div>
                <ul className="divide-y divide-[#E5E7EB] px-5 dark:divide-border">
                  {[
                    {
                      label: t("controlCenter.platformStatus"),
                      ok: data?.sante?.statut === "bon" || !data?.sante?.statut,
                      value: t(sante.labelKey),
                    },
                    {
                      label: t("controlCenter.openAnomalies"),
                      ok: (data?.stats?.ouvertes ?? 0) === 0,
                      value: String(data?.stats?.ouvertes ?? "—"),
                    },
                    {
                      label: t("controlCenter.criticalQueue"),
                      ok: (data?.stats?.critique ?? 0) === 0,
                      value: String(data?.stats?.critique ?? "—"),
                    },
                    {
                      label: t("controlCenter.detectionEngine"),
                      ok: !isError,
                      value: isError ? t("controlCenter.error") : t("controlCenter.operational"),
                    },
                  ].map((row) => (
                    <li
                      key={row.label}
                      className="flex items-center justify-between py-2.5 text-sm"
                    >
                      <span className="text-[#6B7280] dark:text-muted-foreground">
                        {row.label}
                      </span>
                      <span className="inline-flex items-center gap-1.5 font-medium text-[#111827] dark:text-foreground">
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            row.ok ? "bg-emerald-500" : "bg-amber-500",
                          )}
                        />
                        {row.value}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardShell>
            </div>
          </div>

          {/* Category distribution */}
          {cats.length > 0 && (
            <CardShell>
              <div className="border-b border-[#E5E7EB] px-5 py-3 dark:border-border sm:px-6">
                <SectionLabel>{t("controlCenter.distribution")}</SectionLabel>
              </div>
              <div className="grid gap-4 px-5 py-4 sm:grid-cols-2 lg:grid-cols-3 sm:px-6">
                {cats.map(([cat, n]) => (
                  <div key={cat}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-[#6B7280] dark:text-muted-foreground">
                        {catLabel(cat)}
                      </span>
                      <span className="font-semibold tabular-nums text-[#111827] dark:text-foreground">
                        {n}
                      </span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-[#E5E7EB] dark:bg-muted">
                      <div
                        className="h-full rounded-full bg-[#14B8A6]/80"
                        style={{ width: `${(n / maxCat) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardShell>
          )}

          {/* Filters + anomalies list */}
          <div id="liste-anomalies" className="space-y-3">
            <CardShell className="p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="relative min-w-[200px] flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                  <input
                    value={recherche}
                    onChange={(e) => {
                      setRecherche(e.target.value);
                      setPage(1);
                    }}
                    placeholder={t("controlCenter.searchPlaceholder")}
                    className="h-9 w-full rounded-lg border border-[#E5E7EB] bg-[#F7F8FA] pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/30 dark:border-border dark:bg-background"
                  />
                </div>
                <select
                  value={priorite}
                  onChange={(e) => {
                    setPriorite(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 rounded-lg border border-[#E5E7EB] bg-white px-2 text-sm dark:border-border dark:bg-card"
                >
                  <option value="toutes">{t("controlCenter.allPriorities")}</option>
                  <option value="critique">{t("controlCenter.critical")}</option>
                  <option value="important">{t("controlCenter.important")}</option>
                  <option value="attention">{t("controlCenter.watch")}</option>
                  <option value="information">{t("controlCenter.info")}</option>
                </select>
                <select
                  value={categorie}
                  onChange={(e) => {
                    setCategorie(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 rounded-lg border border-[#E5E7EB] bg-white px-2 text-sm dark:border-border dark:bg-card"
                >
                  <option value="toutes">{t("controlCenter.allCategories")}</option>
                  {Object.keys(CAT_LABEL_KEYS).map((k) => (
                    <option key={k} value={k}>
                      {catLabel(k)}
                    </option>
                  ))}
                </select>
                <select
                  value={statut}
                  onChange={(e) => {
                    setStatut(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 rounded-lg border border-[#E5E7EB] bg-white px-2 text-sm dark:border-border dark:bg-card"
                >
                  <option value="ouvertes">{t("controlCenter.statusOpen")}</option>
                  <option value="resolue">{t("controlCenter.statusResolved")}</option>
                  <option value="ignoree">{t("controlCenter.statusIgnored")}</option>
                  <option value="toutes">{t("controlCenter.statusAll")}</option>
                </select>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setRecherche("");
                    setCategorie("toutes");
                    setPriorite("toutes");
                    setStatut("ouvertes");
                    setPage(1);
                  }}
                >
                  {t("controlCenter.reset")}
                </Button>
              </div>
            </CardShell>

            {isLoading ? (
              <div className="flex justify-center py-16 text-[#6B7280]">
                <Loader2 className="mr-2 h-5 w-5 animate-spin text-[#14B8A6]" />
                {t("controlCenter.analysing")}
              </div>
            ) : isError ? (
              <CardShell className="p-8 text-center">
                <XCircle className="mx-auto h-6 w-6 text-red-500" />
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {error?.message || t("controlCenter.loadError")}
                </p>
                <Button
                  type="button"
                  size="sm"
                  className="mt-3"
                  onClick={() => refetch()}
                >
                  {t("controlCenter.retry")}
                </Button>
              </CardShell>
            ) : !data?.anomalies?.length ? (
              <CardShell className="border-dashed py-14 text-center">
                <ShieldCheck className="mx-auto h-8 w-8 text-emerald-500/70" />
                <p className="mt-3 text-sm font-medium text-[#111827] dark:text-foreground">
                  {t("controlCenter.noAnomalies")}
                </p>
                <p className="text-xs text-[#6B7280] dark:text-muted-foreground">
                  {t("controlCenter.allCompliantFilters")}
                </p>
              </CardShell>
            ) : (
              <>
                {/* Desktop table */}
                <CardShell className="hidden overflow-hidden md:block">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-[#E5E7EB] text-[11px] uppercase tracking-wide text-[#9CA3AF] dark:border-border">
                          <th className="px-5 py-2.5 font-medium">{t("controlCenter.priority")}</th>
                          <th className="px-4 py-2.5 font-medium">{t("controlCenter.anomaly")}</th>
                          <th className="px-4 py-2.5 font-medium">{t("controlCenter.internship")}</th>
                          <th className="px-4 py-2.5 font-medium">{t("controlCenter.company")}</th>
                          <th className="px-4 py-2.5 font-medium">{t("controlCenter.category")}</th>
                          <th className="px-5 py-2.5 text-right font-medium">
                            {t("controlCenter.action")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.anomalies.map((a) => (
                          <tr
                            key={a.id}
                            className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#F7F8FA]/80 dark:border-border dark:hover:bg-muted/30"
                          >
                            <td className="px-5 py-3">
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase",
                                  PRIORITE_BADGE[a.priorite],
                                )}
                              >
                                <span
                                  className={cn(
                                    "h-1.5 w-1.5 rounded-full",
                                    PRIORITE_DOT[a.priorite],
                                  )}
                                />
                                {prioriteLabel(a.priorite)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-medium text-[#111827] dark:text-foreground">
                                {a.titre}
                              </p>
                              <p className="line-clamp-1 text-xs text-[#6B7280] dark:text-muted-foreground">
                                {a.description}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-xs font-medium tabular-nums">
                                {a.stage?.code}
                              </p>
                              <p className="text-xs text-[#6B7280] dark:text-muted-foreground">
                                {a.stagiaire?.nomComplet}
                              </p>
                            </td>
                            <td className="max-w-[140px] truncate px-4 py-3 text-xs text-[#6B7280] dark:text-muted-foreground">
                              {a.entreprise?.nom}
                            </td>
                            <td className="px-4 py-3 text-xs text-[#6B7280] dark:text-muted-foreground">
                              {catLabel(a.categorie)}
                            </td>
                            <td className="px-5 py-3 text-right">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="border-[#E5E7EB]"
                                onClick={() => setSelected(a)}
                              >
                                <Eye className="mr-1 h-3.5 w-3.5" />
                                {t("controlCenter.view")}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardShell>

                {/* Mobile */}
                <ul className="space-y-3 md:hidden">
                  {data.anomalies.map((a) => (
                    <li key={a.id}>
                      <CardShell className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className={cn(
                              "rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase",
                              PRIORITE_BADGE[a.priorite],
                            )}
                          >
                            {prioriteLabel(a.priorite)}
                          </span>
                          <span className="text-[11px] text-[#9CA3AF]">
                            {catLabel(a.categorie)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-medium text-[#111827] dark:text-foreground">
                          {a.titre}
                        </p>
                        <p className="mt-1 text-xs text-[#6B7280] dark:text-muted-foreground">
                          {a.stage?.code} · {a.stagiaire?.nomComplet}
                        </p>
                        <p className="text-xs text-[#6B7280] dark:text-muted-foreground">
                          {a.entreprise?.nom}
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="mt-3 w-full border-[#E5E7EB]"
                          onClick={() => setSelected(a)}
                        >
                          {t("controlCenter.viewAnomaly")}
                        </Button>
                      </CardShell>
                    </li>
                  ))}
                </ul>

                {data.pagination && (
                  <div className="flex items-center justify-between text-xs text-[#6B7280] dark:text-muted-foreground">
                    <span>
                      {(data.pagination.page - 1) * data.pagination.limit + 1}–
                      {Math.min(
                        data.pagination.page * data.pagination.limit,
                        data.pagination.total,
                      )}{" "}
                      {t("controlCenter.of")} {data.pagination.total}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-[#E5E7EB]"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                      >
                        {t("controlCenter.prev")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-[#E5E7EB]"
                        disabled={page >= data.pagination.totalPages}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        {t("controlCenter.next")}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Drawer détail — même logique de résolution */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.button
              type="button"
              className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
              aria-label={t("controlCenter.close")}
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
                  <SectionLabel>{t("controlCenter.anomalyAnalysis")}</SectionLabel>
                  <h2 className="mt-1 text-lg font-semibold text-[#111827] dark:text-foreground">
                    {selected.titre}
                  </h2>
                  <span
                    className={cn(
                      "mt-2 inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase",
                      PRIORITE_BADGE[selected.priorite],
                    )}
                  >
                    {prioriteLabel(selected.priorite)}
                  </span>
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
                    {t("controlCenter.description")}
                  </p>
                  <p className="mt-1 text-[#111827] dark:text-foreground">
                    {selected.description}
                  </p>
                </div>
                {selected.raison && (
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-[#9CA3AF]">
                      {t("controlCenter.whyDetected")}
                    </p>
                    <p className="mt-1 text-[#6B7280] dark:text-muted-foreground">
                      {selected.raison}
                    </p>
                  </div>
                )}
                {selected.impact && (
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-[#9CA3AF]">
                      {t("controlCenter.potentialImpact")}
                    </p>
                    <p className="mt-1 text-[#6B7280] dark:text-muted-foreground">
                      {selected.impact}
                    </p>
                  </div>
                )}
                <div className="rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] p-3 text-xs dark:border-border dark:bg-muted/40">
                  <p>
                    <span className="text-[#9CA3AF]">{t("controlCenter.internship")}:</span>{" "}
                    {selected.stage?.code}
                  </p>
                  <p>
                    <span className="text-[#9CA3AF]">{t("controlCenter.intern")}:</span>{" "}
                    {selected.stagiaire?.nomComplet}
                  </p>
                  <p>
                    <span className="text-[#9CA3AF]">{t("controlCenter.company")}:</span>{" "}
                    {selected.entreprise?.nom}
                  </p>
                  <p>
                    <span className="text-[#9CA3AF]">{t("controlCenter.category")}:</span>{" "}
                    {catLabel(selected.categorie)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(selected.actions || []).map((act) => (
                    <Button
                      key={act.href}
                      asChild
                      size="sm"
                      variant="outline"
                      className="border-[#E5E7EB]"
                    >
                      <Link href={act.href}>{act.label}</Link>
                    </Button>
                  ))}
                </div>
                {(selected.statut === "nouvelle" ||
                  selected.statut === "en_cours") && (
                  <div className="space-y-2 border-t border-[#E5E7EB] pt-4 dark:border-border">
                    {selected.code === "dates_incoherentes" ? (
                      <>
                        {selected.statut === "en_cours" ? (
                          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm dark:border-amber-900/40 dark:bg-amber-950/30">
                            <p className="font-medium text-amber-900 dark:text-amber-200">
                              {t("controlCenter.correctionRequested")}
                            </p>
                            <p className="mt-1 text-xs text-[#6B7280] dark:text-muted-foreground">
                              {t("controlCenter.correctionRequestedDesc")}
                            </p>
                          </div>
                        ) : (
                          <>
                            <label className="text-[11px] font-medium uppercase tracking-wide text-[#9CA3AF]">
                              {t("controlCenter.noteOptional")}
                            </label>
                            <textarea
                              value={note}
                              onChange={(e) => setNote(e.target.value)}
                              rows={2}
                              className="w-full rounded-lg border border-[#E5E7EB] bg-[#F7F8FA] px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/30 dark:border-border dark:bg-background"
                              placeholder={t("controlCenter.notePlaceholderCompany")}
                            />
                            <Button
                              type="button"
                              size="sm"
                              disabled={resolveMut.isPending}
                              onClick={() =>
                                handleResolve("demander_correction")
                              }
                              className="bg-[#14B8A6] text-white hover:bg-[#0d9488]"
                            >
                              <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                              {resolveMut.isPending
                                ? t("controlCenter.sending")
                                : t("controlCenter.requestCorrection")}
                            </Button>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <label className="text-[11px] font-medium uppercase tracking-wide text-[#9CA3AF]">
                          {t("controlCenter.resolutionNote")}
                        </label>
                        <textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          rows={2}
                          className="w-full rounded-lg border border-[#E5E7EB] bg-[#F7F8FA] px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/30 dark:border-border dark:bg-background"
                          placeholder={t("controlCenter.resolutionPlaceholder")}
                        />
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            disabled={resolveMut.isPending}
                            onClick={() => handleResolve("resolue")}
                            className="bg-[#14B8A6] text-white hover:bg-[#0d9488]"
                          >
                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                            {t("controlCenter.markResolved")}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="border-[#E5E7EB]"
                            disabled={resolveMut.isPending}
                            onClick={() => handleResolve("ignoree")}
                          >
                            {t("controlCenter.ignore")}
                          </Button>
                        </div>
                      </>
                    )}
                    {resolveMut.isError && (
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {resolveMut.error?.message}
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div className="border-t border-[#E5E7EB] p-3 dark:border-border">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setSelected(null)}
                >
                  {t("controlCenter.close")}
                </Button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
