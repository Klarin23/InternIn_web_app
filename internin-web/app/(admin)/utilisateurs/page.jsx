"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import {
  FiSearch,
  FiRefreshCw,
  FiDownload,
  FiX,
  FiAlertTriangle,
  FiMoreHorizontal,
} from "react-icons/fi";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import AppHeader from "@/components/layout/AppHeader";
import AdminPageHeader from "@/components/layout/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import UtilisateurDetailPanel from "@/components/features/gestion-utilisateurs/UtilisateurDetailPanel";
import { useTousUtilisateurs } from "@/lib/queries/useTousUtilisateurs";
import { useUtilisateursAdminStats } from "@/lib/queries/useUtilisateursAdmin";
import { useChangerStatutCompteUtilisateur } from "@/lib/queries/useChangerStatutCompteUtilisateur";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { cn } from "@/lib/utils";

/* ─── Helpers (logique inchangée) ─────────────────────────────────────── */

const LOCALES_INTL = { fr: "fr-FR", en: "en-US" };

function formatDate(date, locale = "fr-FR") {
  if (!date) return "—";
  return new Date(date).toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatRelative(date, t, locale) {
  if (!date) return t("peopleCenter.never");
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t("peopleCenter.justNow");
  if (mins < 60) return t("peopleCenter.minsAgo", { n: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 48) return t("peopleCenter.hoursAgo", { n: hours });
  return formatDate(date, LOCALES_INTL[locale] || "fr-FR");
}

function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function exportCsv(rows, t) {
  const headers = [
    t("peopleCenter.csvName"),
    t("peopleCenter.csvEmail"),
    t("peopleCenter.csvType"),
    t("peopleCenter.csvOrganization"),
    t("peopleCenter.csvStatus"),
    t("peopleCenter.csvEmailVerified"),
    t("peopleCenter.csvSignupDate"),
    t("peopleCenter.csvLastLogin"),
  ];
  const lines = [headers.join(";")];
  for (const u of rows) {
    lines.push(
      [
        u.nom,
        u.email,
        u.role,
        u.organisation,
        u.statutCompte,
        u.emailVerifie ? t("peopleCenter.csvYes") : t("peopleCenter.csvNo"),
        u.dateCreation
          ? new Date(u.dateCreation).toISOString().slice(0, 10)
          : "",
        u.derniereConnexion
          ? new Date(u.derniereConnexion).toISOString().slice(0, 10)
          : "",
      ]
        .map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`)
        .join(";"),
    );
  }
  const blob = new Blob(["\ufeff" + lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `utilisateurs-internin-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function initials(name) {
  if (!name) return "?";
  const parts = String(name).trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}

function Avatar({ name, size = "md" }) {
  const cls =
    size === "sm"
      ? "h-9 w-9 text-xs"
      : size === "lg"
        ? "h-11 w-11 text-sm"
        : "h-10 w-10 text-sm";
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-[#F3F4F6] font-semibold text-[#6B7280] ring-1 ring-[#E5E7EB] dark:bg-muted dark:text-muted-foreground dark:ring-border",
        cls,
      )}
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}

function StatusDot({ statut, t }) {
  const map = {
    actif: {
      dot: "bg-emerald-500",
      label: t("peopleCenter.statusActive"),
    },
    suspendu: {
      dot: "bg-[#9CA3AF]",
      label: t("peopleCenter.statusSuspended"),
    },
    inactif: {
      dot: "bg-amber-500",
      label: t("peopleCenter.statusInactive"),
    },
  };
  const m = map[statut] || {
    dot: "bg-[#9CA3AF]",
    label: statut || "—",
  };
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-[#6B7280] dark:text-muted-foreground">
      <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} />
      {m.label}
    </span>
  );
}

function RoleLabel({ role, t }) {
  const labels = {
    stagiaire: t("peopleCenter.roleIntern"),
    entreprise: t("peopleCenter.roleCompany"),
    universite: t("peopleCenter.roleUniversity"),
    administrateur: t("peopleCenter.roleAdmin"),
    superviseur: t("peopleCenter.roleSupervisor"),
    membre_entreprise: t("peopleCenter.roleTeamMember"),
  };
  return (
    <span className="text-xs font-medium text-[#111827] dark:text-foreground">
      {labels[role] || role || "—"}
    </span>
  );
}


/** Menu d'actions en portail fixed — évite le clip par overflow-x-auto du tableau. */
function UserRowActions({
  user,
  open,
  onToggle,
  onClose,
  onView,
  onActivate,
  onSuspend,
  isPending,
  t,
}) {
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const menuHeight = 96;
    const gap = 6;
    const width = 176;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < menuHeight + gap && rect.top > menuHeight;
    const top = openUp
      ? Math.max(8, rect.top - menuHeight - gap)
      : rect.bottom + gap;
    let left = rect.right - width;
    left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
    setCoords({ top, left });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (btnRef.current?.contains(e.target)) return;
      if (menuRef.current?.contains(e.target)) return;
      onClose();
    };
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    const onScroll = () => onClose();
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, onClose]);

  const menu =
    open &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        ref={menuRef}
        role="menu"
        className="fixed z-[80] w-44 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white py-1 shadow-lg dark:border-border dark:bg-card"
        style={{ top: coords.top, left: coords.left }}
      >
        <button
          type="button"
          role="menuitem"
          className="block w-full px-3 py-2 text-left text-xs text-[#111827] hover:bg-[#F7F8FA] dark:text-foreground dark:hover:bg-muted"
          onClick={() => {
            onView();
            onClose();
          }}
        >
          {t("peopleCenter.actionView")}
        </button>
        {user.statutCompte === "suspendu" ? (
          <button
            type="button"
            role="menuitem"
            disabled={isPending}
            className="block w-full px-3 py-2 text-left text-xs text-[#111827] hover:bg-[#F7F8FA] disabled:opacity-50 dark:text-foreground dark:hover:bg-muted"
            onClick={() => {
              onActivate();
              onClose();
            }}
          >
            {t("peopleCenter.actionActivate")}
          </button>
        ) : (
          <button
            type="button"
            role="menuitem"
            disabled={isPending}
            className="block w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/30"
            onClick={() => {
              onSuspend();
              onClose();
            }}
          >
            {t("peopleCenter.actionSuspend")}
          </button>
        )}
      </div>,
      document.body,
    );

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="rounded-lg p-1.5 text-[#9CA3AF] hover:bg-[#F7F8FA] hover:text-[#111827] dark:hover:bg-muted dark:hover:text-foreground"
        aria-label={t("peopleCenter.colActions")}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
      >
        <FiMoreHorizontal className="h-4 w-4" />
      </button>
      {menu}
    </>
  );
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

/* ─── Page ────────────────────────────────────────────────────────────── */

export default function UtilisateursPage() {
  const reduceMotion = useReducedMotion();
  const { t, locale } = useTranslation();
  const searchParams = useSearchParams();
  const idFromUrl = searchParams?.get("id") || null;

  const [recherche, setRecherche] = useState("");
  const rechercheDebounced = useDebounced(recherche, 300);
  const [role, setRole] = useState("");
  const [statut, setStatut] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(!!idFromUrl);
  const [menuId, setMenuId] = useState(null);

  // Deep-link ?id= : ne pas appliquer les filtres (évite setState dans un effect)
  const roleQuery = idFromUrl ? undefined : role || undefined;
  const statutQuery = idFromUrl ? undefined : statut || undefined;

  const {
    data: utilisateurs,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useTousUtilisateurs({
    recherche: rechercheDebounced,
    role: roleQuery,
    statut: statutQuery,
  });
  const { data: stats, isLoading: loadingStats } = useUtilisateursAdminStats();
  const statutMutation = useChangerStatutCompteUtilisateur();

  const selectedIdEffectif = useMemo(() => {
    const list = utilisateurs || [];
    if (idFromUrl) return idFromUrl;
    if (selectedId && list.some((u) => u.idUtilisateur === selectedId)) {
      return selectedId;
    }
    return null;
  }, [utilisateurs, selectedId, idFromUrl]);

  const selected =
    (utilisateurs || []).find((u) => u.idUtilisateur === selectedIdEffectif) ||
    null;

  // Ouvrir le drawer si deep-link
  useEffect(() => {
    if (idFromUrl) setDrawerOpen(true);
  }, [idFromUrl]);

  const ROLE_TABS = [
    { value: "", label: t("peopleCenter.filterAll") },
    { value: "stagiaire", label: t("peopleCenter.filterInterns") },
    { value: "entreprise", label: t("peopleCenter.filterCompanies") },
    { value: "universite", label: t("peopleCenter.filterUniversities") },
    { value: "superviseur", label: t("peopleCenter.filterSupervisors") },
  ];

  const STATUT_TABS = [
    { value: "", label: t("peopleCenter.filterAllStatuses") },
    { value: "actif", label: t("peopleCenter.filterActive") },
    { value: "suspendu", label: t("peopleCenter.filterSuspended") },
    { value: "inactif", label: t("peopleCenter.filterInactive") },
  ];

  function openUser(id) {
    setSelectedId(id);
    setDrawerOpen(true);
    setMenuId(null);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    if (!idFromUrl) setSelectedId(null);
  }

  return (
    <>
      <AppHeader breadcrumb={[{ label: t("peopleCenter.breadcrumbAdmin") }, { label: t("peopleCenter.breadcrumbPeople") }]} refreshKeys={["tousUtilisateurs", "utilisateursAdminStats", "adminStats"]} />
      <div className="px-4 pt-5 sm:px-6">
        <AdminPageHeader
          context={t("peopleCenter.context")}
          title={t("peopleCenter.title")}
          description={t("peopleCenter.subtitle")}
        />
      </div>


      <div className="min-h-full bg-[#F7F8FA] dark:bg-background">
        <motion.div
          className="space-y-5 px-4 py-5 sm:px-6 lg:px-8"
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm text-[#6B7280] dark:text-muted-foreground">
                {t("peopleCenter.tagline")}
              </p>
              {stats?.total != null && (
                <p className="mt-2 text-xs tabular-nums text-[#9CA3AF]">
                  {stats.total.toLocaleString()} {t("peopleCenter.usersCount")}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-[#E5E7EB] bg-white dark:border-border dark:bg-card"
                disabled={!utilisateurs?.length}
                onClick={() => exportCsv(utilisateurs || [], t)}
              >
                <FiDownload className="mr-1.5 h-3.5 w-3.5" />
                {t("peopleCenter.exportCsv")}
                {utilisateurs?.length ? ` (${utilisateurs.length})` : ""}
              </Button>
              <Button
                type="button"
                size="sm"
                className="bg-[#14B8A6] text-white hover:bg-[#0d9488]"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <FiRefreshCw
                  className={cn(
                    "mr-1.5 h-3.5 w-3.5",
                    isFetching && "animate-spin",
                  )}
                />
                {t("peopleCenter.refresh")}
              </Button>
            </div>
          </div>

          {/* People overview — single strip */}
          <CardShell className="overflow-hidden">
            <div className="border-b border-[#E5E7EB] px-5 py-3 dark:border-border sm:px-6">
              <SectionLabel>{t("peopleCenter.overview")}</SectionLabel>
            </div>
            {loadingStats ? (
              <div className="grid grid-cols-2 gap-0 sm:grid-cols-3 lg:grid-cols-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="px-4 py-4">
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 divide-x divide-y divide-[#E5E7EB] sm:grid-cols-3 lg:grid-cols-6 dark:divide-border">
                {[
                  {
                    label: t("peopleCenter.kpiTotal"),
                    value: stats?.total,
                  },
                  {
                    label: t("peopleCenter.kpiActive"),
                    value: stats?.actifs,
                  },
                  {
                    label: t("peopleCenter.kpiInterns"),
                    value: stats?.stagiaires,
                  },
                  {
                    label: t("peopleCenter.kpiCompanies"),
                    value: stats?.entreprises,
                  },
                  {
                    label: t("peopleCenter.kpiSuspended"),
                    value: stats?.suspendus,
                    warn: (stats?.suspendus ?? 0) > 0,
                  },
                  {
                    label: t("peopleCenter.kpiUnverified"),
                    value: stats?.emailNonVerifie,
                    warn: (stats?.emailNonVerifie ?? 0) > 0,
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
            )}
          </CardShell>

          {/* Search — central */}
          <div className="relative w-full">
            <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              type="search"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder={t("peopleCenter.searchPlaceholder")}
              className="h-12 w-full rounded-2xl border border-[#E5E7EB] bg-white pl-11 pr-10 text-sm text-[#111827] shadow-[0_1px_2px_rgba(17,24,39,0.04)] outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/30 dark:border-border dark:bg-card dark:text-foreground"
              aria-label={t("peopleCenter.searchAria")}
            />
            {recherche && (
              <button
                type="button"
                onClick={() => setRecherche("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[#9CA3AF] hover:bg-[#F7F8FA] dark:hover:bg-muted"
                aria-label={t("peopleCenter.clear")}
              >
                <FiX className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filters — segmented */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-1.5">
              {ROLE_TABS.map((tab) => (
                <button
                  key={tab.value || "all"}
                  type="button"
                  onClick={() => setRole(tab.value)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
                    role === tab.value
                      ? "border-[#14B8A6]/40 bg-[#14B8A6]/10 text-[#0f766e] dark:text-[#14B8A6]"
                      : "border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#F7F8FA] dark:border-border dark:bg-card dark:hover:bg-muted",
                  )}
                >
                  {tab.label}
                </button>
              ))}
              <span className="mx-1 hidden w-px self-stretch bg-[#E5E7EB] sm:block dark:bg-border" />
              {STATUT_TABS.map((tab) => (
                <button
                  key={tab.value || "all-s"}
                  type="button"
                  onClick={() => setStatut(tab.value)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
                    statut === tab.value
                      ? "border-[#14B8A6]/40 bg-[#14B8A6]/10 text-[#0f766e] dark:text-[#14B8A6]"
                      : "border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#F7F8FA] dark:border-border dark:bg-card dark:hover:bg-muted",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {isError && (
            <CardShell className="flex flex-col items-center gap-2 py-12 text-center">
              <FiAlertTriangle className="h-7 w-7 text-red-500" />
              <p className="text-sm font-semibold text-[#111827] dark:text-foreground">
                {t("peopleCenter.loadError")}
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => refetch()}
              >
                {t("peopleCenter.retry")}
              </Button>
            </CardShell>
          )}

          {isLoading && (
            <CardShell className="overflow-hidden">
              <div className="space-y-0 divide-y divide-[#E5E7EB] dark:divide-border">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-56" />
                    </div>
                    <Skeleton className="hidden h-4 w-20 sm:block" />
                    <Skeleton className="hidden h-4 w-16 md:block" />
                  </div>
                ))}
              </div>
            </CardShell>
          )}

          {!isLoading && !isError && (utilisateurs || []).length === 0 && (
            <CardShell className="border-dashed py-16 text-center">
              <p className="text-sm font-semibold text-[#111827] dark:text-foreground">
                {t("peopleCenter.emptyTitle")}
              </p>
              <p className="mt-1 text-xs text-[#6B7280] dark:text-muted-foreground">
                {t("peopleCenter.emptyDesc")}
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-4 border-[#E5E7EB]"
                onClick={() => {
                  setRecherche("");
                  setRole("");
                  setStatut("");
                }}
              >
                {t("peopleCenter.clearFilters")}
              </Button>
            </CardShell>
          )}

          {!isLoading && !isError && (utilisateurs || []).length > 0 && (
            <CardShell className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-3 dark:border-border sm:px-6">
                <SectionLabel>{t("peopleCenter.directory")}</SectionLabel>
                <p className="text-[11px] tabular-nums text-[#9CA3AF]">
                  {utilisateurs.length}{" "}
                  {utilisateurs.length > 1
                    ? t("peopleCenter.results")
                    : t("peopleCenter.result")}
                </p>
              </div>

              {/* Desktop table */}
              <div className="hidden overflow-x-auto overflow-y-visible md:block">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] text-[11px] uppercase tracking-wide text-[#9CA3AF] dark:border-border">
                      <th className="px-5 py-2.5 font-medium sm:px-6">
                        {t("peopleCenter.colUser")}
                      </th>
                      <th className="px-3 py-2.5 font-medium">
                        {t("peopleCenter.colRole")}
                      </th>
                      <th className="px-3 py-2.5 font-medium">
                        {t("peopleCenter.colStatus")}
                      </th>
                      <th className="px-3 py-2.5 font-medium">
                        {t("peopleCenter.colActivity")}
                      </th>
                      <th className="px-5 py-2.5 text-right font-medium sm:px-6">
                        {t("peopleCenter.colActions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {utilisateurs.map((u) => {
                      const active =
                        selected?.idUtilisateur === u.idUtilisateur &&
                        drawerOpen;
                      return (
                        <tr
                          key={u.idUtilisateur}
                          className={cn(
                            "border-b border-[#E5E7EB] last:border-0 transition-colors dark:border-border",
                            active
                              ? "bg-[#14B8A6]/[0.04]"
                              : "hover:bg-[#F7F8FA]/80 dark:hover:bg-muted/30",
                          )}
                        >
                          <td className="px-5 py-3 sm:px-6">
                            <button
                              type="button"
                              onClick={() => openUser(u.idUtilisateur)}
                              className="flex w-full items-center gap-3 text-left"
                            >
                              <Avatar name={u.nom} />
                              <div className="min-w-0">
                                <p className="truncate font-medium text-[#111827] dark:text-foreground">
                                  {u.nom}
                                </p>
                                <p className="truncate text-xs text-[#6B7280] dark:text-muted-foreground">
                                  {u.email}
                                </p>
                                {u.organisation &&
                                  u.organisation !== "—" && (
                                    <p className="truncate text-[11px] text-[#9CA3AF]">
                                      {u.organisation}
                                    </p>
                                  )}
                              </div>
                            </button>
                          </td>
                          <td className="px-3 py-3">
                            <RoleLabel role={u.role} t={t} />
                          </td>
                          <td className="px-3 py-3">
                            <StatusDot statut={u.statutCompte} t={t} />
                          </td>
                          <td className="px-3 py-3 text-xs text-[#6B7280] dark:text-muted-foreground">
                            {formatRelative(u.derniereConnexion, t, locale)}
                          </td>
                          <td className="px-5 py-3 text-right sm:px-6">
                            <UserRowActions
                              user={u}
                              open={menuId === u.idUtilisateur}
                              onToggle={() =>
                                setMenuId((id) =>
                                  id === u.idUtilisateur
                                    ? null
                                    : u.idUtilisateur,
                                )
                              }
                              onClose={() => setMenuId(null)}
                              onView={() => openUser(u.idUtilisateur)}
                              onActivate={() =>
                                statutMutation.mutate({
                                  id: u.idUtilisateur,
                                  statutCompte: "actif",
                                })
                              }
                              onSuspend={() => {
                                if (confirm(t("peopleCenter.confirmSuspend"))) {
                                  statutMutation.mutate({
                                    id: u.idUtilisateur,
                                    statutCompte: "suspendu",
                                  });
                                }
                              }}
                              isPending={statutMutation.isPending}
                              t={t}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <ul className="divide-y divide-[#E5E7EB] md:hidden dark:divide-border">
                {utilisateurs.map((u) => (
                  <li key={u.idUtilisateur}>
                    <button
                      type="button"
                      onClick={() => openUser(u.idUtilisateur)}
                      className="flex w-full items-center gap-3 px-5 py-3.5 text-left"
                    >
                      <Avatar name={u.nom} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[#111827] dark:text-foreground">
                          {u.nom}
                        </p>
                        <p className="truncate text-xs text-[#6B7280] dark:text-muted-foreground">
                          {u.email}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <RoleLabel role={u.role} t={t} />
                          <StatusDot statut={u.statutCompte} t={t} />
                        </div>
                      </div>
                      <FiMoreHorizontal className="h-4 w-4 shrink-0 text-[#9CA3AF]" />
                    </button>
                  </li>
                ))}
              </ul>
            </CardShell>
          )}
        </motion.div>
      </div>

      {/* User drawer — même UtilisateurDetailPanel + logique statut */}
      <AnimatePresence>
        {drawerOpen && selected && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.button
              type="button"
              className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
              aria-label={t("peopleCenter.close")}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDrawer}
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              className="relative z-10 flex h-full w-full max-w-lg flex-col border-l border-[#E5E7EB] bg-white shadow-xl dark:border-border dark:bg-card"
              initial={reduceMotion ? false : { x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
            >
              <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-3 dark:border-border">
                <SectionLabel>{t("peopleCenter.userProfile")}</SectionLabel>
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="rounded-lg p-1.5 text-[#9CA3AF] hover:bg-[#F7F8FA] dark:hover:bg-muted"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <UtilisateurDetailPanel
                  utilisateur={selected}
                  statutMutation={statutMutation}
                />
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
