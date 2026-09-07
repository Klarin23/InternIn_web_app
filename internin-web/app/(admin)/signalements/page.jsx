"use client";

/**
 * Admin → Signalements — Moderation & Resolution Center
 * UI/UX refonte uniquement. Hooks, API, statuts et actions inchangés.
 *
 * Données réelles (listLitiges) :
 * idLitige, idStage, typeLitige, description, statut,
 * dateCreation, dateResolution, emailPlaignant, adminAssigne
 *
 * Statuts métier : ouvert | en_cours | resolu | rejete
 * (pas de priorité en base — non inventée)
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FiSearch,
  FiDownload,
  FiCheck,
  FiLoader,
  FiInbox,
  FiUser,
  FiBriefcase,
  FiExternalLink,
  FiX,
  FiCornerUpLeft,
  FiPlay,
  FiAlertTriangle,
  FiMessageSquare,
  FiPaperclip,
} from "react-icons/fi";
import { motion, useReducedMotion } from "framer-motion";
import AppHeader from "@/components/layout/AppHeader";
import AdminPageHeader from "@/components/layout/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useLitigesAdmin,
  useChangerStatutLitige,
  useNotesLitige,
  useAddNoteLitige,
  useMessagesLitige,
  useAddMessageLitige,
  useEscaladerLitige,
  useDemanderInfoLitige,
  usePiecesLitige,
  useUploadPieceLitige,
  useHistoriqueLitige,
  useActionDisciplinaireLitige,
} from "@/lib/queries/useLitiges";
import { toast } from "@/lib/store/useToastStore";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/useTranslation";

/** Statuts réels du schéma litiges_reclamations — labels via i18n */
const STATUT_META = {
  ouvert: {
    labelKey: "adminReports.statusOpen",
    dot: "bg-teal-500",
    text: "text-teal-700 dark:text-teal-400",
  },
  en_cours: {
    labelKey: "adminReports.statusInReview",
    dot: "bg-sky-500",
    text: "text-sky-700 dark:text-sky-400",
  },
  resolu: {
    labelKey: "adminReports.statusResolved",
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  rejete: {
    labelKey: "adminReports.statusDismissed",
    dot: "bg-muted-foreground/60",
    text: "text-muted-foreground",
  },
};

const FILTRE_TAB_VALUES = ["tous", "ouvert", "en_cours", "resolu", "rejete"];

/** Aligné sur litiges.schema.js — transitions serveur */
const TRANSITIONS_LITIGE = {
  ouvert: ["en_cours", "rejete"],
  en_cours: ["resolu", "rejete", "ouvert"],
  resolu: ["ouvert"],
  rejete: ["ouvert"],
};

const SEVERITE_META = {
  faible: { labelKey: "adminReports.severityLow", text: "text-muted-foreground" },
  moyen: { labelKey: "adminReports.severityMedium", text: "text-amber-700 dark:text-amber-400" },
  eleve: { labelKey: "adminReports.severityHigh", text: "text-orange-700 dark:text-orange-400" },
  critique: { labelKey: "adminReports.severityCritical", text: "text-destructive" },
};

function codeSignalement(id) {
  return `R-${String(id || "").replace(/-/g, "").slice(0, 4).toUpperCase()}`;
}

function dateLocaleTag(locale) {
  return locale === "en" ? "en-GB" : "fr-FR";
}

function formatDate(date, locale = "fr") {
  if (!date) return "—";
  return new Date(date).toLocaleDateString(dateLocaleTag(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date, locale = "fr") {
  if (!date) return "—";
  const d = new Date(date);
  const tag = dateLocaleTag(locale);
  return {
    date: d.toLocaleDateString(tag, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    time: d.toLocaleTimeString(tag, {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

function formatRelative(date, t, locale = "fr") {
  if (!date) return "—";
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return t("adminReports.relativeMinutes", { n: Math.max(1, mins) });
  const hours = Math.floor(mins / 60);
  if (hours < 48) return t("adminReports.relativeHours", { n: hours });
  const days = Math.floor(hours / 24);
  if (days < 14) return t("adminReports.relativeDays", { n: days });
  return formatDate(date, locale);
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
    t("adminReports.csvCode"),
    t("adminReports.csvType"),
    t("adminReports.csvStatus"),
    t("adminReports.csvReporter"),
    t("adminReports.csvAssignedAdmin"),
    t("adminReports.csvCreatedAt"),
    t("adminReports.csvResolvedAt"),
    t("adminReports.csvDescription"),
  ];
  const lines = [headers.join(";")];
  for (const l of rows) {
    lines.push(
      [
        codeSignalement(l.idLitige),
        l.typeLitige,
        l.statut,
        l.emailPlaignant,
        l.adminAssigne || "",
        l.dateCreation
          ? new Date(l.dateCreation).toISOString()
          : "",
        l.dateResolution
          ? new Date(l.dateResolution).toISOString()
          : "",
        (l.description || "").replace(/\n/g, " "),
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
  a.download = `signalements-internin-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function StatusPill({ statut }) {
  const { t } = useTranslation();
  const meta = STATUT_META[statut] || STATUT_META.ouvert;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        meta.text,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {t(meta.labelKey)}
    </span>
  );
}

function CaseSkeleton() {
  return (
    <div className="space-y-px border border-border bg-card">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-2 border-b border-border px-4 py-3.5 last:border-b-0"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-4 w-2/3 max-w-xs" />
          <div className="flex gap-4">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SignalementsPage() {
  const { t, locale } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [recherche, setRecherche] = useState("");
  const rechercheDebounced = useDebounced(recherche, 300);
  const [filtre, setFiltre] = useState("tous");
  const [selectedId, setSelectedId] = useState(null);
  const [confirmStatut, setConfirmStatut] = useState(null);
  const [motifDecision, setMotifDecision] = useState("");
  const [filtreSeverite, setFiltreSeverite] = useState("tous");
  const [filtreSla, setFiltreSla] = useState("tous");
  const [mobileDetail, setMobileDetail] = useState(false);

  const {
    data: litiges,
    isLoading,
    isError,
    isFetching,
    refetch,
    error,
  } = useLitigesAdmin(undefined);
  const statutMutation = useChangerStatutLitige();

  const counts = useMemo(() => {
    const list = litiges || [];
    const enRetard = (litiges || []).filter((l) => l.enRetard).length;
    return {
      enRetard,
      tous: list.length,
      ouvert: list.filter((l) => l.statut === "ouvert").length,
      en_cours: list.filter((l) => l.statut === "en_cours").length,
      resolu: list.filter((l) => l.statut === "resolu").length,
      rejete: list.filter((l) => l.statut === "rejete").length,
    };
  }, [litiges]);

  const openCases = counts.ouvert + counts.en_cours;
  const requiresAttention = useMemo(() => {
    return (litiges || []).filter(
      (l) =>
        (l.statut === "ouvert" || l.statut === "en_cours") &&
        (l.severite === "critique" ||
          l.severite === "eleve" ||
          !l.adminAssigne ||
          l.enRetard ||
          l.escalade),
    );
  }, [litiges]);

  const unassigned = useMemo(() => {
    return (litiges || []).filter(
      (l) =>
        (l.statut === "ouvert" || l.statut === "en_cours") && !l.adminAssigne,
    ).length;
  }, [litiges]);

  const filtrees = useMemo(() => {
    let list = litiges || [];
    if (filtre !== "tous") {
      list = list.filter((l) => l.statut === filtre);
    }
    if (filtreSeverite !== "tous") {
      list = list.filter((l) => l.severite === filtreSeverite);
    }
    if (filtreSla === "en_retard") {
      list = list.filter((l) => l.enRetard);
    } else if (filtreSla === "escalade") {
      list = list.filter((l) => l.escalade);
    } else if (filtreSla === "attend_info") {
      list = list.filter((l) => l.attendInfo);
    }
    const q = rechercheDebounced.trim().toLowerCase();
    if (q) {
      list = list.filter((l) => {
        const hay = [
          l.typeLitige,
          l.description,
          l.emailPlaignant,
          l.adminAssigne,
          l.idLitige,
          codeSignalement(l.idLitige),
          l.idStage,
          l.cibleType,
          l.cibleLabel,
          l.nomEntreprise,
          l.nomSuperviseur,
          l.reference,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }
    return list;
  }, [litiges, filtre, filtreSeverite, filtreSla, rechercheDebounced]);

  // Sélection dérivée — pas de setState dans un useEffect
  const selectedIdEffectif = useMemo(() => {
    if (!filtrees.length) return null;
    if (
      selectedId != null &&
      filtrees.some((l) => l.idLitige === selectedId)
    ) {
      return selectedId;
    }
    return filtrees[0]?.idLitige ?? null;
  }, [filtrees, selectedId]);

  const selected =
    filtrees.find((l) => l.idLitige === selectedIdEffectif) || null;

  function applyStatut(statut) {
    if (!selected) return;
    const needsMotif = statut === "resolu" || statut === "rejete";
    if (needsMotif && !motifDecision.trim()) {
      toast.error(
        statut === "resolu"
          ? t("adminReports.motifRequiredResolve")
          : t("adminReports.motifRequiredReject"),
      );
      return;
    }
    statutMutation.mutate(
      {
        id: selected.idLitige,
        statut,
        motif: needsMotif ? motifDecision.trim() : undefined,
      },
      {
        onSuccess: () => {
          toast.success(
            statut === "en_cours"
              ? t("adminReports.toastTaken")
              : statut === "resolu"
                ? t("adminReports.toastResolved")
                : statut === "rejete"
                  ? t("adminReports.toastRejected")
                  : t("adminReports.toastStatusUpdated"),
          );
          setConfirmStatut(null);
          setMotifDecision("");
        },
        onError: (err) => {
          toast.error(err?.message || t("adminReports.toastUpdateFailed"));
        },
      },
    );
  }

  function requestStatut(statut) {
    if (!selected) return;
    const allowed = TRANSITIONS_LITIGE[selected.statut] || [];
    if (!allowed.includes(statut)) {
      toast.error(t("adminReports.toastTransitionDenied", { status: selected.statut }));
      return;
    }
    setMotifDecision("");
    setConfirmStatut(statut);
  }

  function selectCase(id) {
    setSelectedId(id);
    setMobileDetail(true);
  }

  const confirmCopy = {
    en_cours: {
      title: t("adminReports.confirmTakeTitle"),
      desc: t("adminReports.confirmTakeDesc"),
      action: t("adminReports.confirmTakeAction"),
    },
    resolu: {
      title: t("adminReports.confirmResolveTitle"),
      desc: selected
        ? t("adminReports.confirmResolveDesc", {
            code: codeSignalement(selected.idLitige),
          })
        : t("adminReports.confirmResolveDescFallback"),
      action: t("adminReports.confirmResolveAction"),
    },
    rejete: {
      title: t("adminReports.confirmRejectTitle"),
      desc: selected
        ? t("adminReports.confirmRejectDesc", {
            code: codeSignalement(selected.idLitige),
          })
        : t("adminReports.confirmRejectDescFallback"),
      action: t("adminReports.confirmRejectAction"),
    },
    ouvert: {
      title: t("adminReports.confirmReopenTitle"),
      desc: t("adminReports.confirmReopenDesc"),
      action: t("adminReports.confirmReopenAction"),
    },
  };

  return (
    <>
      <AppHeader breadcrumb={[{ label: t("adminReports.breadcrumbAdmin") }, { label: t("adminReports.breadcrumbModeration") }]} refreshKeys={["litigesAdmin", "adminStats"]} />

      <motion.div
        className="space-y-6 px-4 py-5 sm:px-6"
        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* ── Header ── */}
        <AdminPageHeader
          context={t("adminReports.context")}
          title={t("adminReports.title")}
          description={t("adminReports.description")}
          metadata={
            <>
              <span className="font-semibold text-foreground">
                {openCases === 1
                  ? t("adminReports.openCases", { count: openCases })
                  : t("adminReports.openCasesPlural", { count: openCases })}
              </span>
              {isFetching && !isLoading ? ` · ${t("adminReports.updating")}` : null}
            </>
          }
          actions={
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!filtrees.length}
              onClick={() => exportCsv(filtrees, t)}
              className="h-9 gap-1.5 text-xs font-semibold"
            >
              <FiDownload className="h-3.5 w-3.5" />
              {t("adminReports.exportCsv")}
              {filtrees.length ? ` (${filtrees.length})` : ""}
            </Button>
          }
        />

        {/* ── Overview (editorial, not KPI cards) ── */}
        <div className="rounded-lg border border-border bg-card px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {t("adminReports.overview")}
          </p>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-8 gap-y-3">
            <OverviewStat value={counts.tous} label={t("adminReports.total")} />
            <span className="hidden h-8 w-px bg-border sm:block" />
            <OverviewStat value={counts.ouvert} label={t("adminReports.statusOpen")} accent />
            <span className="hidden h-8 w-px bg-border sm:block" />
            <OverviewStat value={counts.en_cours} label={t("adminReports.statusInReview")} />
            <span className="hidden h-8 w-px bg-border sm:block" />
            <OverviewStat value={unassigned} label={t("adminReports.unassigned")} />
            <span className="hidden h-8 w-px bg-border sm:block" />
            <OverviewStat value={counts.resolu} label={t("adminReports.statusResolved")} />
          </div>
        </div>

        {/* ── Search + filters ── */}
        <div className="space-y-3">
          <div className="relative">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder={t("adminReports.searchPlaceholder")}
              className="h-11 w-full rounded-lg border border-border bg-card pl-10 pr-3 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/30"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-card p-1">
            {FILTRE_TAB_VALUES.map((value) => {
              const active = filtre === value;
              const count =
                value === "tous"
                  ? counts.tous
                  : counts[value] ?? 0;
              const label =
                value === "tous"
                  ? t("adminReports.statusAll")
                  : t(STATUT_META[value].labelKey);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFiltre(value)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-semibold transition",
                    active
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {label}
                  <span
                    className={cn(
                      "ml-1.5 tabular-nums",
                      active ? "opacity-70" : "opacity-50",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-1">
            {[
              { value: "tous", labelKey: "adminReports.severityAll" },
              { value: "critique", labelKey: "adminReports.severityCritical" },
              { value: "eleve", labelKey: "adminReports.severityHigh" },
              { value: "moyen", labelKey: "adminReports.severityMedium" },
              { value: "faible", labelKey: "adminReports.severityLow" },
            ].map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setFiltreSeverite(tab.value)}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-xs font-semibold transition",
                  filtreSeverite === tab.value
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {t(tab.labelKey)}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1">
            {[
              { value: "tous", labelKey: "adminReports.slaAll" },
              { value: "en_retard", labelKey: "adminReports.slaOverdue" },
              { value: "escalade", labelKey: "adminReports.slaEscalated" },
              { value: "attend_info", labelKey: "adminReports.slaAwaitingInfo" },
            ].map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setFiltreSla(tab.value)}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-xs font-semibold transition",
                  filtreSla === tab.value
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {t(tab.labelKey)}
              </button>
            ))}
          </div>

        </div>

        {/* ── Error ── */}
        {isError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error?.message || t("adminReports.loadError")}
            <button
              type="button"
              onClick={() => refetch()}
              className="ml-2 font-semibold underline underline-offset-2"
            >
              {t("adminReports.retry")}
            </button>
          </div>
        )}

        {/* ── Loading ── */}
        {isLoading && <CaseSkeleton />}

        {/* ── Empty ── */}
        {!isLoading && !isError && filtrees.length === 0 && (
          <div className="rounded-lg border border-border bg-card px-6 py-16 text-center">
            <FiInbox className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-semibold text-foreground">
              {(litiges || []).length === 0
                ? t("adminReports.emptyNoneTitle")
                : t("adminReports.emptyFilteredTitle")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {(litiges || []).length === 0
                ? t("adminReports.emptyNoneDesc")
                : t("adminReports.emptyFilteredDesc")}
            </p>
            {(recherche || filtre !== "tous") && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setRecherche("");
                  setFiltre("tous");
                }}
              >
                {t("adminReports.clearFilters")}
              </Button>
            )}
          </div>
        )}

        {/* ── Case list + detail ── */}
        {!isLoading && !isError && filtrees.length > 0 && (
          <div className="grid grid-cols-1 gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)] lg:gap-0 lg:overflow-hidden lg:rounded-lg lg:border lg:border-border">
            {/* List */}
            <div
              className={cn(
                "min-h-0 border border-border bg-card lg:border-0 lg:border-r",
                mobileDetail && "hidden lg:block",
              )}
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  {t("adminReports.cases")}
                </p>
                <p className="text-[11px] tabular-nums text-muted-foreground">
                  {t("adminReports.ofTotal", {
                    filtered: filtrees.length,
                    total: counts.tous,
                  })}
                </p>
              </div>
              <div className="max-h-[min(70vh,720px)] divide-y divide-border overflow-y-auto">
                {filtrees.map((l) => {
                  const active = l.idLitige === selectedIdEffectif;
                  const closed =
                    l.statut === "resolu" || l.statut === "rejete";
                  return (
                    <button
                      key={l.idLitige}
                      type="button"
                      onClick={() => selectCase(l.idLitige)}
                      className={cn(
                        "flex w-full flex-col gap-1.5 px-4 py-3.5 text-left transition",
                        active
                          ? "bg-muted/60"
                          : "hover:bg-muted/30",
                        closed && "opacity-70",
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="font-mono text-[10px] font-medium tracking-wide text-muted-foreground">
                          #{codeSignalement(l.idLitige)}
                        </span>
                        <StatusPill statut={l.statut} />
                        {l.escalade && (
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-destructive">
                            {t("adminReports.escalated")}
                          </span>
                        )}
                        {l.enRetard && (
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                            {t("adminReports.overdue")}
                          </span>
                        )}
                        {l.attendInfo && (
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                            {t("adminReports.awaitingInfo")}
                          </span>
                        )}
                        {l.severite && SEVERITE_META[l.severite] && (
                          <span className={cn("text-[10px] font-semibold uppercase tracking-wide", SEVERITE_META[l.severite].text)}>
                            {t(SEVERITE_META[l.severite].labelKey)}
                          </span>
                        )}
                        <span className="ml-auto text-[11px] text-muted-foreground">
                          {formatRelative(l.dateCreation, t, locale)}
                        </span>
                      </div>
                      <p className="truncate text-sm font-semibold text-foreground">
                        {l.cibleLabel || l.typeLitige || t("adminReports.caseLabel")}
                      </p>
                      {(l.cibleType || l.nomEntreprise || l.nomSuperviseur) && (
                        <p className="truncate text-[11px] text-muted-foreground">
                          {l.cibleType === "superviseur"
                            ? t("adminReports.targetSupervisor", {
                                name: l.nomSuperviseur || "—",
                                company: l.nomEntreprise || "—",
                              })
                            : l.cibleType === "entreprise"
                              ? t("adminReports.targetCompany", {
                                  name: l.nomEntreprise || "—",
                                })
                              : l.nomEntreprise || null}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-muted-foreground">
                        <span>
                          <span className="text-muted-foreground/70">
                            {t("adminReports.reportedBy")}{" "}
                          </span>
                          <span className="text-foreground/80">
                            {l.emailPlaignant || "—"}
                          </span>
                        </span>
                        <span>
                          {l.adminAssigne ? (
                            <>
                              <span className="text-muted-foreground/70">
                                {t("adminReports.assignedTo")}{" "}
                              </span>
                              <span className="text-foreground/80">
                                {l.adminAssigne}
                              </span>
                            </>
                          ) : (
                            <span className="text-muted-foreground/70">
                              {t("adminReports.unassigned")}
                            </span>
                          )}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Detail panel */}
            <div
              className={cn(
                "min-h-0 border border-border bg-card lg:border-0",
                !mobileDetail && "hidden lg:block",
              )}
            >
              {selected ? (
                <CaseDetail
                  litige={selected}
                  isPending={statutMutation.isPending}
                  onChangeStatut={(s) => requestStatut(s)}
                  onCloseMobile={() => setMobileDetail(false)}
                />
              ) : (
                <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                  {t("adminReports.selectCase")}
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Confirm decision */}
      <Dialog
        open={!!confirmStatut}
        onOpenChange={(o) => !o && setConfirmStatut(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmStatut && confirmCopy[confirmStatut]?.title}
            </DialogTitle>
            <DialogDescription>
              {confirmStatut && confirmCopy[confirmStatut]?.desc}
            </DialogDescription>
          </DialogHeader>
          {(confirmStatut === "resolu" || confirmStatut === "rejete") && (
            <div className="space-y-2 px-1">
              <label className="text-sm font-medium text-foreground" htmlFor="motif-decision">
                {confirmStatut === "resolu"
                  ? t("adminReports.resolutionSummary")
                  : t("adminReports.rejectionReason")}
              </label>
              <textarea
                id="motif-decision"
                rows={3}
                value={motifDecision}
                onChange={(e) => setMotifDecision(e.target.value)}
                placeholder={
                  confirmStatut === "resolu"
                    ? t("adminReports.resolutionPlaceholder")
                    : t("adminReports.rejectionPlaceholder")
                }
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              />
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmStatut(null)}
              disabled={statutMutation.isPending}
            >
              {t("adminReports.cancel")}
            </Button>
            <Button
              type="button"
              onClick={() => confirmStatut && applyStatut(confirmStatut)}
              disabled={statutMutation.isPending}
              className={cn(
                confirmStatut === "rejete" &&
                  "bg-foreground text-background hover:bg-foreground/90",
              )}
            >
              {statutMutation.isPending ? (
                <FiLoader className="h-4 w-4 animate-spin" />
              ) : null}
              {confirmStatut && confirmCopy[confirmStatut]?.action}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function OverviewStat({ value, label, accent }) {
  return (
    <div>
      <p
        className={cn(
          "text-2xl font-semibold tabular-nums tracking-tight",
          accent ? "text-foreground" : "text-foreground",
        )}
      >
        {value}
      </p>
      <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function CaseDetail({ litige, isPending, onChangeStatut, onCloseMobile }) {
  const { t, locale } = useTranslation();
  const created = formatDateTime(litige.dateCreation, locale);
  const resolved = formatDateTime(litige.dateResolution, locale);
  const allowed = TRANSITIONS_LITIGE[litige.statut] || [];
  const can = (s) => allowed.includes(s);
  const isReview = litige.statut === "en_cours";
  const isClosed =
    litige.statut === "resolu" || litige.statut === "rejete";

  const timeline = [];
  timeline.push({
    key: "created",
    title: t("adminReports.timelineCreated"),
    detail: litige.emailPlaignant
      ? t("adminReports.timelineCreatedDetail", { email: litige.emailPlaignant })
      : t("adminReports.timelineCreatedDetailFallback"),
    when: created,
  });
  if (litige.adminAssigne) {
    timeline.push({
      key: "assigned",
      title:
        isReview || isClosed
          ? t("adminReports.timelineReviewStarted")
          : t("adminReports.timelineAssigned"),
      detail: t("adminReports.timelineAssignedDetail", {
        name: litige.adminAssigne,
      }),
      when: null,
    });
  }
  if (litige.statut === "resolu" && litige.dateResolution) {
    timeline.push({
      key: "resolved",
      title: t("adminReports.timelineResolved"),
      detail: t("adminReports.timelineResolvedDetail"),
      when: resolved,
    });
  }
  if (litige.statut === "rejete" && litige.dateResolution) {
    timeline.push({
      key: "dismissed",
      title: t("adminReports.timelineDismissed"),
      detail: t("adminReports.timelineDismissedDetail"),
      when: resolved,
    });
  }
  if (!isClosed && timeline.length === 1) {
    timeline.push({
      key: "pending",
      title: t("adminReports.timelineDecision"),
      detail: t("adminReports.timelinePending"),
      when: null,
    });
  }

  return (
    <div className="flex max-h-[min(70vh,720px)] flex-col">
      {/* Detail header */}
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3.5">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {t("adminReports.reportCase")}
          </p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            #{codeSignalement(litige.idLitige)}
          </p>
          <h3 className="mt-1 text-base font-semibold leading-snug text-foreground">
            {litige.cibleLabel || litige.typeLitige || t("adminReports.caseLabel")}
          </h3>
          <div className="mt-2">
            <StatusPill statut={litige.statut} />
          </div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted lg:hidden"
          aria-label={t("adminReports.close")}
        >
          <FiX className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
        {/* Parties */}
        <div className="grid gap-3 sm:grid-cols-1">
          <MetaBlock
            label={t("adminReports.reporter")}
            icon={FiUser}
            primary={litige.emailPlaignant || "—"}
          />
          <MetaBlock
            label={t("adminReports.reportedParty")}
            icon={FiBriefcase}
            primary={
              litige.cibleLabel ||
              (litige.cibleType === "superviseur"
                ? litige.nomSuperviseur ||
                  litige.superviseur?.nom ||
                  t("adminReports.supervisor")
                : litige.nomEntreprise || t("adminReports.company"))
            }
          />
          {litige.cibleType === "superviseur" && litige.nomEntreprise ? (
            <MetaBlock
              label={t("adminReports.company")}
              icon={FiBriefcase}
              primary={litige.nomEntreprise}
            />
          ) : null}
          <MetaBlock
            label={t("adminReports.assignedTo")}
            icon={FiBriefcase}
            primary={litige.adminAssigne || t("adminReports.unassigned")}
            muted={!litige.adminAssigne}
          />
          {(litige.categorie || litige.severite) && (
            <div className="grid grid-cols-2 gap-3">
              {litige.categorie && (
                <MetaBlock label={t("adminReports.category")} primary={litige.categorie} />
              )}
              {litige.severite && SEVERITE_META[litige.severite] && (
                <MetaBlock
                  label={t("adminReports.severity")}
                  primary={t(SEVERITE_META[litige.severite].labelKey)}
                />
              )}
            </div>
          )}
          {litige.reference && (
            <MetaBlock label={t("adminReports.reference")} primary={litige.reference} />
          )}
        </div>

        {/* Reason / description */}
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            {t("adminReports.reason")}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {litige.description || "—"}
          </p>
        </section>

        {/* Dates */}
        <section className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              {t("adminReports.created")}
            </p>
            <p className="mt-1 text-sm text-foreground">{created.date}</p>
            <p className="text-xs text-muted-foreground">{created.time}</p>
          </div>
          {litige.dateResolution && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                {t("adminReports.closed")}
              </p>
              <p className="mt-1 text-sm text-foreground">{resolved.date}</p>
              <p className="text-xs text-muted-foreground">{resolved.time}</p>
            </div>
          )}
        </section>

        {/* Related stage */}
        {litige.idStage && (
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              {t("adminReports.relatedContent")}
            </p>
            <Link
              href={`/gestion-stages/${litige.idStage}`}
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              {t("adminReports.viewStage")}
              <FiExternalLink className="h-3.5 w-3.5" />
            </Link>
          </section>
        )}

        {/* Timeline — only real events */}
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            {t("adminReports.caseHistory")}
          </p>
          <ol className="mt-3 space-y-0">
            {timeline.map((ev, i) => (
              <li key={ev.key} className="relative flex gap-3 pb-4 last:pb-0">
                {i < timeline.length - 1 && (
                  <span className="absolute left-[5px] top-3 h-[calc(100%-8px)] w-px bg-border" />
                )}
                <span
                  className={cn(
                    "relative z-[1] mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-card",
                    i === timeline.length - 1
                      ? "bg-foreground"
                      : "bg-muted-foreground/40",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {ev.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{ev.detail}</p>
                  {ev.when && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground/80">
                      {ev.when.date}
                      {ev.when.time ? ` · ${ev.when.time}` : ""}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>


        {(litige.enRetard || litige.echeanceTraitement) &&
          (litige.statut === "ouvert" || litige.statut === "en_cours") && (
          <div
            className={cn(
              "rounded-md border px-3 py-2.5 text-sm",
              litige.enRetard
                ? "border-amber-500/40 bg-amber-500/5"
                : "border-border bg-muted/20",
            )}
          >
            <p className="font-semibold text-foreground">
              {litige.enRetard
                ? t("adminReports.slaOverdueTitle")
                : t("adminReports.slaInProgressTitle")}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {litige.heuresEcoulees != null
                ? t("adminReports.hoursElapsed", { hours: litige.heuresEcoulees })
                : ""}
              {litige.delaiTraitementHeures
                ? ` · ${t("adminReports.limitHours", { hours: litige.delaiTraitementHeures })}`
                : ""}
              {litige.echeanceTraitement
                ? ` · ${t("adminReports.dueAt", {
                    date: new Date(litige.echeanceTraitement).toLocaleString(
                      dateLocaleTag(locale),
                    ),
                  })}`
                : ""}
            </p>
          </div>
        )}

        {/* Escalation banner */}
        {litige.escalade && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm">
            <p className="font-semibold text-destructive">{t("adminReports.escalatedCase")}</p>
            {litige.motifEscalade && (
              <p className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap">
                {litige.motifEscalade}
              </p>
            )}
          </div>
        )}

        <WorkflowPanels litige={litige} />

        {/* Decision */}
        <section className="rounded-lg border border-border bg-muted/20 p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            {t("adminReports.decision")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("adminReports.decisionHint")}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {can("en_cours") && (
              <Button
                type="button"
                size="sm"
                disabled={isPending}
                onClick={() => onChangeStatut("en_cours")}
                className="h-9 gap-1.5 rounded-md"
              >
                <FiPlay className="h-3.5 w-3.5" />
                {t("adminReports.takeInReview")}
              </Button>
            )}
            {can("resolu") && (
              <Button
                type="button"
                size="sm"
                disabled={isPending}
                onClick={() => onChangeStatut("resolu")}
                className="h-9 gap-1.5 rounded-md"
              >
                <FiCheck className="h-3.5 w-3.5" />
                {t("adminReports.resolve")}
              </Button>
            )}
            {can("rejete") && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => onChangeStatut("rejete")}
                className="h-9 gap-1.5 rounded-md"
              >
                {t("adminReports.dismiss")}
              </Button>
            )}
            {can("ouvert") && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => onChangeStatut("ouvert")}
                className="h-9 gap-1.5 rounded-md"
              >
                <FiCornerUpLeft className="h-3.5 w-3.5" />
                {t("adminReports.reopen")}
              </Button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}


function WorkflowPanels({ litige }) {
  const { t, locale } = useTranslation();
  const id = litige.idLitige;
  const closed = litige.statut === "resolu" || litige.statut === "rejete";
  const { data: notesData, isLoading: loadingNotes } = useNotesLitige(id);
  const addNote = useAddNoteLitige(id);
  const { data: messagesData, isLoading: loadingMsg } = useMessagesLitige(id);
  const addMessage = useAddMessageLitige(id);
  const escalader = useEscaladerLitige();
  const demanderInfo = useDemanderInfoLitige();
  const { data: piecesData } = usePiecesLitige(id);
  const uploadPiece = useUploadPieceLitige(id);
  const { data: histData } = useHistoriqueLitige(id);
  const discipline = useActionDisciplinaireLitige();

  const [noteText, setNoteText] = useState("");
  const [msgText, setMsgText] = useState("");
  const [infoText, setInfoText] = useState("");
  const [escText, setEscText] = useState("");
  const [showEsc, setShowEsc] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showDisc, setShowDisc] = useState(false);
  const [discType, setDiscType] = useState("avertissement");
  const [discMotif, setDiscMotif] = useState("");

  const notes = notesData?.notes || [];
  const messages = messagesData?.messages || [];
  const pieces = piecesData?.pieces || [];

  return (
    <div className="space-y-5">
      {/* Internal notes */}
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          {t("adminReports.internalNotes")}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {t("adminReports.internalNotesHint")}
        </p>
        {loadingNotes ? (
          <Skeleton className="mt-2 h-16 w-full" />
        ) : (
          <ul className="mt-2 space-y-2">
            {notes.length === 0 && (
              <li className="text-xs text-muted-foreground">{t("adminReports.noInternalNotes")}</li>
            )}
            {notes.map((n) => (
              <li
                key={n.idNote}
                className="rounded-md border border-border bg-muted/20 px-3 py-2 text-xs"
              >
                <p className="whitespace-pre-wrap text-foreground">{n.contenu}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {n.adminNom || t("adminReports.roleAdmin")} ·{" "}
                  {n.dateCreation
                    ? new Date(n.dateCreation).toLocaleString(dateLocaleTag(locale))
                    : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
        {!closed && (
          <div className="mt-2 space-y-2">
            <textarea
              rows={2}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder={t("adminReports.addNotePlaceholder")}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={addNote.isPending || noteText.trim().length < 2}
              onClick={() =>
                addNote.mutate(noteText.trim(), {
                  onSuccess: () => {
                    setNoteText("");
                    toast.success(t("adminReports.toastNoteSaved"));
                  },
                  onError: (e) => toast.error(e?.message || t("adminReports.toastError")),
                })
              }
            >
              {t("adminReports.saveNote")}
            </Button>
          </div>
        )}
      </section>

      {/* Messages with reporter */}
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          {t("adminReports.messagesToReporter")}
        </p>
        {loadingMsg ? (
          <Skeleton className="mt-2 h-16 w-full" />
        ) : (
          <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto">
            {messages.length === 0 && (
              <li className="text-xs text-muted-foreground">{t("adminReports.noMessages")}</li>
            )}
            {messages.map((m) => (
              <li
                key={m.idMessage}
                className={cn(
                  "rounded-md border px-3 py-2 text-xs",
                  m.roleAuteur === "admin"
                    ? "border-primary/20 bg-primary/5"
                    : "border-border bg-muted/20",
                )}
              >
                <p className="whitespace-pre-wrap text-foreground">{m.contenu}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {m.roleAuteur === "admin"
                    ? t("adminReports.roleAdmin")
                    : t("adminReports.roleStudent")}{" "}
                  ·{" "}
                  {m.dateCreation
                    ? new Date(m.dateCreation).toLocaleString(dateLocaleTag(locale))
                    : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
        {!closed && (
          <div className="mt-2 space-y-2">
            <textarea
              rows={2}
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
              placeholder={t("adminReports.messagePlaceholder")}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            />
            <Button
              type="button"
              size="sm"
              disabled={addMessage.isPending || msgText.trim().length < 2}
              onClick={() =>
                addMessage.mutate(msgText.trim(), {
                  onSuccess: () => {
                    setMsgText("");
                    toast.success(t("adminReports.toastMessageSent"));
                  },
                  onError: (e) => toast.error(e?.message || t("adminReports.toastError")),
                })
              }
            >
              <FiMessageSquare className="h-3.5 w-3.5" />
              {t("adminReports.sendMessage")}
            </Button>
          </div>
        )}
      </section>

      {/* Request info / Escalate */}
      {!closed && (
        <section className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setShowInfo((v) => !v)}
          >
            {t("adminReports.requestInformation")}
          </Button>
          {!litige.escalade && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="text-destructive"
              onClick={() => setShowEsc((v) => !v)}
            >
              <FiAlertTriangle className="h-3.5 w-3.5" />
              {t("adminReports.escalate")}
            </Button>
          )}
        </section>
      )}

      {showInfo && !closed && (
        <div className="space-y-2 rounded-md border border-border p-3">
          <textarea
            rows={2}
            value={infoText}
            onChange={(e) => setInfoText(e.target.value)}
            placeholder={t("adminReports.infoRequestPlaceholder")}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <Button
            type="button"
            size="sm"
            disabled={demanderInfo.isPending || infoText.trim().length < 5}
            onClick={() =>
              demanderInfo.mutate(
                { id, message: infoText.trim() },
                {
                  onSuccess: () => {
                    setInfoText("");
                    setShowInfo(false);
                    toast.success(t("adminReports.toastRequestSent"));
                  },
                  onError: (e) => toast.error(e?.message || t("adminReports.toastError")),
                },
              )
            }
          >
            {t("adminReports.sendRequest")}
          </Button>
        </div>
      )}

      {showEsc && !closed && (
        <div className="space-y-2 rounded-md border border-destructive/30 p-3">
          <textarea
            rows={2}
            value={escText}
            onChange={(e) => setEscText(e.target.value)}
            placeholder={t("adminReports.escalationPlaceholder")}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <Button
            type="button"
            size="sm"
            disabled={escalader.isPending || escText.trim().length < 5}
            onClick={() =>
              escalader.mutate(
                { id, motif: escText.trim() },
                {
                  onSuccess: () => {
                    setEscText("");
                    setShowEsc(false);
                    toast.success(t("adminReports.toastEscalated"));
                  },
                  onError: (e) => toast.error(e?.message || t("adminReports.toastError")),
                },
              )
            }
          >
            {t("adminReports.confirmEscalation")}
          </Button>
        </div>
      )}


      {/* Audit history */}
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          {t("adminReports.auditTrail")}
        </p>
        <ul className="mt-2 max-h-36 space-y-1.5 overflow-y-auto">
          {(histData?.historique || []).length === 0 && (
            <li className="text-xs text-muted-foreground">{t("adminReports.noAuditActions")}</li>
          )}
          {(histData?.historique || []).map((h) => (
            <li key={h.idJournal} className="border-l-2 border-border pl-2 text-xs">
              <p className="font-medium text-foreground">{h.action}</p>
              {(h.ancienStatut || h.nouveauStatut) && (
                <p className="text-muted-foreground">
                  {h.ancienStatut || "—"} → {h.nouveauStatut || "—"}
                </p>
              )}
              {h.motif && (
                <p className="text-muted-foreground line-clamp-2">{h.motif}</p>
              )}
              <p className="text-[10px] text-muted-foreground/80">
                {h.adminEmail || t("adminReports.roleAdmin")}
                {h.dateCreation
                  ? ` · ${new Date(h.dateCreation).toLocaleString(dateLocaleTag(locale))}`
                  : ""}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Disciplinary — uses existing compte suspendu */}
      {!closed && litige.idEntreprise && (
        <section className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            {t("adminReports.disciplinaryActions")}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {t("adminReports.disciplinaryHint")}
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="text-destructive"
            onClick={() => setShowDisc((v) => !v)}
          >
            {t("adminReports.companyAction")}
          </Button>
          {showDisc && (
            <div className="space-y-2 rounded-md border border-destructive/30 p-3">
              <select
                value={discType}
                onChange={(e) => setDiscType(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="avertissement">{t("adminReports.optionWarning")}</option>
                <option value="suspendre_entreprise">{t("adminReports.optionSuspend")}</option>
              </select>
              <textarea
                rows={2}
                value={discMotif}
                onChange={(e) => setDiscMotif(e.target.value)}
                placeholder={t("adminReports.disciplinaryReasonPlaceholder")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <Button
                type="button"
                size="sm"
                disabled={discipline.isPending || discMotif.trim().length < 5}
                onClick={() =>
                  discipline.mutate(
                    { id, type: discType, motif: discMotif.trim() },
                    {
                      onSuccess: () => {
                        setDiscMotif("");
                        setShowDisc(false);
                        toast.success(
                          discType === "suspendre_entreprise"
                            ? t("adminReports.toastCompanySuspended")
                            : t("adminReports.toastWarningSent"),
                        );
                      },
                      onError: (e) =>
                        toast.error(e?.message || t("adminReports.toastActionFailed")),
                    },
                  )
                }
              >
                {t("adminReports.confirm")}
              </Button>
            </div>
          )}
        </section>
      )}

      {/* Evidence workspace */}
      <section className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          {t("adminReports.evidence")}
        </p>
        {(() => {
          const studentPieces = pieces.filter((pc) => pc.roleUploader === "stagiaire");
          const lastMsg = (messages || []).slice(-1)[0];
          const hasNewInfo =
            !litige.attendInfo &&
            (lastMsg?.roleAuteur === "stagiaire" || studentPieces.length > 0);
          return hasNewInfo ? (
            <div className="rounded-lg border border-teal-500/25 bg-teal-500/[0.06] px-3 py-2.5 text-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-teal-800 dark:text-teal-300">
                {t("adminReports.newInformation")}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("adminReports.studentProvidedInfo")}
                {studentPieces.length > 0
                  ? ` · ${
                      studentPieces.length === 1
                        ? t("adminReports.filesCount", { count: studentPieces.length })
                        : t("adminReports.filesCountPlural", {
                            count: studentPieces.length,
                          })
                    }`
                  : ""}
                .
              </p>
            </div>
          ) : null;
        })()}
        <ul className="space-y-2">
          {pieces.length === 0 && (
            <li className="text-xs text-muted-foreground">{t("adminReports.noAttachments")}</li>
          )}
          {pieces.map((pc) => (
            <li
              key={pc.idPiece}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 bg-card px-3 py-2 text-xs"
            >
              <div className="flex min-w-0 items-center gap-2">
                <FiPaperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{pc.nomOriginal}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {(pc.mimeType || "file").replace("application/", "").replace("image/", "").toUpperCase()}
                    {pc.tailleOctets != null ? ` · ${Math.round(pc.tailleOctets / 1024)} KB` : ""}
                    {" · "}
                    {t("adminReports.uploadedBy")}{" "}
                    {pc.roleUploader === "admin"
                      ? t("adminReports.uploadedByAdmin")
                      : t("adminReports.uploadedByStudent")}
                    {pc.dateUpload
                      ? ` · ${new Date(pc.dateUpload).toLocaleString(dateLocaleTag(locale))}`
                      : ""}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {!closed && (
          <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-primary">
            <input
              type="file"
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.txt"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                uploadPiece.mutate(f, {
                  onSuccess: () => toast.success(t("adminReports.toastAttachmentAdded")),
                  onError: (err) =>
                    toast.error(err?.message || t("adminReports.toastUploadFailed")),
                });
                e.target.value = "";
              }}
            />
            {uploadPiece.isPending
              ? t("adminReports.uploading")
              : t("adminReports.addAttachment")}
          </label>
        )}
      </section>
    </div>
  );
}


function MetaBlock({ label, icon: Icon, primary, muted }) {
  return (
    <div className="rounded-md border border-border px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {Icon ? <Icon className="h-3 w-3" /> : null}
        {label}
      </p>
      <p
        className={cn(
          "mt-1 truncate text-sm font-medium",
          muted ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {primary}
      </p>
    </div>
  );
}
