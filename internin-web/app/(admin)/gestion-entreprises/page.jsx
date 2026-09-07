"use client";

/**
 * Admin → Entreprises — Company Intelligence & Verification Center
 * Refonte UI/UX. Hooks, bulk actions, détail, export conservés.
 */

import { useEffect, useMemo, useState } from "react";
import {
  FiBriefcase,
  FiCheck,
  FiX,
  FiAlertTriangle,
  FiSearch,
  FiShield,
  FiUsers,
  FiDownload,
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
import EntrepriseFiltresTabs from "@/components/features/gestion-entreprises/EntrepriseFiltresTabs";
import EntrepriseDetailPanel from "@/components/features/gestion-entreprises/EntrepriseDetailPanel";
import { useToutesEntreprises } from "@/lib/queries/useToutesEntreprises";
import { useChangerStatutCompteEntreprise } from "@/lib/queries/useChangerStatutCompteEntreprise";
import { useVerifierEntreprise } from "@/lib/queries/useVerifierEntreprise";
import { useActionsMasseEntreprises } from "@/lib/queries/useActionsMasseEntreprises";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/useTranslation";

function getBadge(e) {
  if (e.statutCompte === "suspendu") {
    return {
      labelKey: "statusRestricted",
      dot: "bg-destructive",
      text: "text-destructive",
    };
  }
  if (e.statutVerification === "verifiee") {
    return {
      labelKey: "statusVerified",
      dot: "bg-emerald-500",
      text: "text-emerald-700 dark:text-emerald-400",
    };
  }
  if (e.statutVerification === "rejetee") {
    return {
      labelKey: "statusRejected",
      dot: "bg-muted-foreground/60",
      text: "text-muted-foreground",
    };
  }
  return {
    labelKey: "statusPending",
    dot: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-400",
  };
}

function formatDate(date, t) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString(t("adminEntreprises.localeDate"), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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
    t("adminEntreprises.csvName"),
    t("adminEntreprises.csvEmail"),
    t("adminEntreprises.csvSector"),
    t("adminEntreprises.csvCity"),
    t("adminEntreprises.csvCountry"),
    t("adminEntreprises.csvVerificationStatus"),
    t("adminEntreprises.csvAccountStatus"),
    t("adminEntreprises.csvOffers"),
    t("adminEntreprises.csvInternships"),
    t("adminEntreprises.csvDocuments"),
    t("adminEntreprises.csvCreatedDate"),
  ];
  const lines = [headers.join(";")];
  for (const e of rows) {
    lines.push(
      [
        e.nomEntreprise,
        e.email,
        e.secteurActivite,
        e.ville,
        e.pays,
        e.statutVerification,
        e.statutCompte,
        e.nbOffres ?? 0,
        e.nbStages ?? 0,
        e.nbDocuments ?? 0,
        e.dateCreation
          ? new Date(e.dateCreation).toISOString()
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
  a.download = `entreprises-internin-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function StatusPill({ badge }) {
  const { t } = useTranslation();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        badge.text,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", badge.dot)} />
      {t(`adminEntreprises.${badge.labelKey}`)}
    </span>
  );
}

function EntrepriseRow({
  entreprise,
  isActive,
  isChecked,
  onActivate,
  onToggleCheck,
}) {
  const { t } = useTranslation();
  const badge = getBadge(entreprise);
  return (
    <div
      className={cn(
        "flex items-start gap-2 border-b border-border px-3 py-3 transition last:border-b-0",
        isActive ? "bg-muted/50" : "hover:bg-muted/30",
        entreprise.enRetard &&
          entreprise.statutVerification === "en_attente" &&
          "bg-amber-500/[0.04]",
      )}
    >
      <label className="mt-3 flex shrink-0 cursor-pointer items-center">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={() => onToggleCheck(entreprise.idEntreprise)}
          className="h-3.5 w-3.5 rounded border-border"
          aria-label={t("adminEntreprises.selectCompanyAria", {
            name: entreprise.nomEntreprise,
          })}
        />
      </label>
      <button
        type="button"
        onClick={() => onActivate(entreprise.idEntreprise)}
        className="flex min-w-0 flex-1 gap-3 text-left focus-visible:outline-none"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
          {entreprise.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={entreprise.logoUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <FiBriefcase className="h-4 w-4 text-muted-foreground" aria-hidden />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <p className="truncate text-sm font-semibold text-foreground">
              {entreprise.nomEntreprise}
            </p>
            <StatusPill badge={badge} />
          </div>
          <p className="truncate text-[11px] text-muted-foreground">
            {[entreprise.secteurActivite, entreprise.ville, entreprise.pays]
              .filter(Boolean)
              .join(" · ") || "—"}
          </p>
          <div className="flex flex-wrap gap-x-3 text-[11px] text-muted-foreground">
            <span>
              <span className="text-muted-foreground/70">
                {t("adminEntreprises.rowOffersLabel")}{" "}
              </span>
              <span className="text-foreground/80">{entreprise.nbOffres ?? 0}</span>
            </span>
            <span>
              <span className="text-muted-foreground/70">
                {t("adminEntreprises.rowInternshipsLabel")}{" "}
              </span>
              <span className="text-foreground/80">{entreprise.nbStages ?? 0}</span>
            </span>
            <span>
              <span className="text-muted-foreground/70">
                {t("adminEntreprises.rowDocsLabel")}{" "}
              </span>
              <span className="text-foreground/80">
                {entreprise.nbDocuments ?? 0}
              </span>
            </span>
            <span className="text-muted-foreground/80">
              {t("adminEntreprises.joinedPrefix", {
                date: formatDate(entreprise.dateCreation, t),
              })}
            </span>
            {entreprise.enRetard &&
            entreprise.statutVerification === "en_attente" ? (
              <span className="font-medium text-amber-700 dark:text-amber-400">
                {t("adminEntreprises.overdueSuffix", {
                  elapsed: entreprise.heuresEcoulees,
                  sla: entreprise.delaiTraitementHeures,
                })}
              </span>
            ) : null}
          </div>
        </div>
      </button>
    </div>
  );
}

export default function GestionEntreprisesPage() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [recherche, setRecherche] = useState("");
  const rechercheDebounced = useDebounced(recherche, 300);
  const [filtre, setFiltre] = useState("tous");
  const [selectedId, setSelectedId] = useState(null);
  const [checked, setChecked] = useState(() => new Set());
  const [bulkAction, setBulkAction] = useState(null);
  const [bulkMotif, setBulkMotif] = useState("");

  const {
    data: entreprises,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useToutesEntreprises(rechercheDebounced);
  const verifierMutation = useVerifierEntreprise();
  const statutMutation = useChangerStatutCompteEntreprise();
  const bulkMutation = useActionsMasseEntreprises();

  const counts = useMemo(() => {
    const list = entreprises || [];
    return {
      tous: list.length,
      en_attente: list.filter(
        (e) =>
          e.statutVerification === "en_attente" && e.statutCompte !== "suspendu",
      ).length,
      verifiee: list.filter(
        (e) =>
          e.statutVerification === "verifiee" && e.statutCompte !== "suspendu",
      ).length,
      rejetee: list.filter(
        (e) =>
          e.statutVerification === "rejetee" && e.statutCompte !== "suspendu",
      ).length,
      suspendu: list.filter((e) => e.statutCompte === "suspendu").length,
    };
  }, [entreprises]);

  const entreprisesFiltrees = useMemo(() => {
    const list = entreprises || [];
    if (filtre === "tous") return list;
    if (filtre === "suspendu") {
      return list.filter((e) => e.statutCompte === "suspendu");
    }
    return list.filter(
      (e) =>
        e.statutVerification === filtre && e.statutCompte !== "suspendu",
    );
  }, [entreprises, filtre]);

  const selectedIdEffectif = useMemo(() => {
    if (!entreprisesFiltrees.length) return null;
    if (
      selectedId != null &&
      entreprisesFiltrees.some((e) => e.idEntreprise === selectedId)
    ) {
      return selectedId;
    }
    return entreprisesFiltrees[0]?.idEntreprise ?? null;
  }, [entreprisesFiltrees, selectedId]);

  const selected =
    entreprisesFiltrees.find((e) => e.idEntreprise === selectedIdEffectif) ||
    null;

  const checkedEffectif = useMemo(() => {
    const ids = new Set(entreprisesFiltrees.map((e) => e.idEntreprise));
    return new Set([...checked].filter((id) => ids.has(id)));
  }, [checked, entreprisesFiltrees]);

  function toggleCheck(id) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (checkedEffectif.size === entreprisesFiltrees.length) {
      setChecked(new Set());
    } else {
      setChecked(new Set(entreprisesFiltrees.map((e) => e.idEntreprise)));
    }
  }

  function openBulk(action) {
    setBulkMotif("");
    setBulkAction(action);
  }

  function confirmBulk() {
    if (!bulkAction || checkedEffectif.size === 0) return;
    bulkMutation.mutate(
      {
        action: bulkAction,
        ids: [...checkedEffectif],
        motif: bulkAction === "rejeter" ? bulkMotif.trim() : undefined,
      },
      {
        onSettled: () => {
          setBulkAction(null);
          setChecked(new Set());
        },
      },
    );
  }

  const bulkLabels = {
    verifier: t("adminEntreprises.bulkActionVerify"),
    rejeter: t("adminEntreprises.bulkActionReject"),
    suspendre: t("adminEntreprises.bulkActionRestrict"),
    reactiver: t("adminEntreprises.bulkActionReactivate"),
  };

  return (
    <>
      <AppHeader
        breadcrumb={[
          { label: t("adminEntreprises.breadcrumbAdmin") },
          { label: t("adminEntreprises.breadcrumbOrganizations") },
        ]}
        refreshKeys={["toutesEntreprises", "adminStats"]}
      />

      <motion.div
        className="space-y-6 px-4 py-5 sm:px-6"
        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <AdminPageHeader
          context={t("adminEntreprises.context")}
          title={t("adminEntreprises.title")}
          description={t("adminEntreprises.description")}
          metadata={<>
              <span className="font-semibold text-foreground">{counts.en_attente}</span>{" "}
              {t("adminEntreprises.pendingVerification")}
              {counts.suspendu > 0 && (
                <> · <span className="font-semibold text-foreground">{counts.suspendu}</span>{" "}
                  {t("adminEntreprises.restricted")}</>
              )}
              {isFetching && !isLoading && ` · ${t("adminEntreprises.updating")}`}
            </>}
          actions={<Button type="button" variant="outline" size="sm" className="h-9 gap-1.5 text-xs font-semibold" disabled={!entreprisesFiltrees.length} onClick={() => exportCsv(entreprisesFiltrees, t)}>
              <FiDownload className="h-3.5 w-3.5" />
              {t("adminEntreprises.exportCsv")}
              {entreprisesFiltrees.length ? ` (${entreprisesFiltrees.length})` : ""}
            </Button>}
        />

        {/* Needs attention */}
        {(counts.en_attente > 0 || counts.suspendu > 0) && (
          <div className="rounded-lg border border-border bg-card px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              {t("adminEntreprises.needsAttention")}
            </p>
            <p className="mt-1.5 text-sm text-foreground">
              {counts.en_attente > 0 && (
                <span>
                  {t(
                    counts.en_attente > 1
                      ? "adminEntreprises.companyAwaitingPlural"
                      : "adminEntreprises.companyAwaitingSingular",
                    { n: counts.en_attente },
                  )}
                </span>
              )}
              {counts.en_attente > 0 && counts.suspendu > 0 && " · "}
              {counts.suspendu > 0 && (
                <span>
                  {t(
                    counts.suspendu > 1
                      ? "adminEntreprises.restrictedAccountPlural"
                      : "adminEntreprises.restrictedAccountSingular",
                    { n: counts.suspendu },
                  )}
                </span>
              )}
            </p>
          </div>
        )}

        {/* Search + filters */}
        <div className="space-y-3">
          <div className="relative">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder={t("adminEntreprises.searchPlaceholder")}
              className="h-11 w-full rounded-lg border border-border bg-card pl-10 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/30"
            />
          </div>
          <EntrepriseFiltresTabs
            value={filtre}
            onChange={setFiltre}
            counts={counts}
          />
        </div>

        {/* Bulk bar */}
        {checkedEffectif.size > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-2.5">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">
                {checkedEffectif.size}
              </span>{" "}
              {t("adminEntreprises.bulkSelectedCount")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => openBulk("verifier")}
              >
                {t("adminEntreprises.bulkVerify")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="text-destructive"
                onClick={() => openBulk("rejeter")}
              >
                {t("adminEntreprises.bulkReject")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => openBulk("suspendre")}
              >
                {t("adminEntreprises.bulkRestrict")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => openBulk("reactiver")}
              >
                {t("adminEntreprises.bulkReactivate")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setChecked(new Set())}
              >
                {t("adminEntreprises.bulkClear")}
              </Button>
            </div>
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 py-12 text-center">
            <FiAlertTriangle className="h-6 w-6 text-destructive" />
            <p className="text-sm font-semibold">
              {t("adminEntreprises.loadError")}
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => refetch()}
            >
              {t("adminEntreprises.retry")}
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 gap-0 overflow-hidden rounded-lg border border-border lg:grid-cols-[minmax(0,1fr)_minmax(320px,1fr)]">
            <div className="divide-y divide-border">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2 px-4 py-3.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
              ))}
            </div>
            <Skeleton className="min-h-[320px] rounded-none" />
          </div>
        )}

        {!isLoading && !isError && entreprisesFiltrees.length === 0 && (
          <div className="rounded-lg border border-border bg-card px-6 py-16 text-center">
            <FiUsers className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-semibold text-foreground">
              {(entreprises || []).length === 0
                ? t("adminEntreprises.emptyTitleNone")
                : t("adminEntreprises.emptyTitleFiltered")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("adminEntreprises.emptyDesc")}
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
                {t("adminEntreprises.clearFilters")}
              </Button>
            )}
          </div>
        )}

        {!isLoading && !isError && entreprisesFiltrees.length > 0 && (
          <div className="grid grid-cols-1 overflow-hidden rounded-lg border border-border lg:grid-cols-[minmax(0,420px)_1fr]">
            <div className="border-border bg-card lg:border-r">
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={
                      checkedEffectif.size > 0 &&
                      checkedEffectif.size === entreprisesFiltrees.length
                    }
                    onChange={toggleAll}
                    className="h-3.5 w-3.5 rounded border-border"
                  />
                  {t("adminEntreprises.selectAll", {
                    n: entreprisesFiltrees.length,
                  })}
                </label>
              </div>
              <div className="max-h-[min(70vh,720px)] overflow-y-auto">
                {entreprisesFiltrees.map((e) => (
                  <EntrepriseRow
                    key={e.idEntreprise}
                    entreprise={e}
                    isActive={selected?.idEntreprise === e.idEntreprise}
                    isChecked={checkedEffectif.has(e.idEntreprise)}
                    onActivate={setSelectedId}
                    onToggleCheck={toggleCheck}
                  />
                ))}
              </div>
            </div>

            {selected && (
              <div className="min-h-0 bg-card">
                <EntrepriseDetailPanel
                  entreprise={selected}
                  badge={{
                    label: t(`adminEntreprises.${getBadge(selected).labelKey}`),
                    className: cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold",
                      getBadge(selected).text,
                      "bg-transparent",
                    ),
                  }}
                  verifierMutation={verifierMutation}
                  statutMutation={statutMutation}
                />
              </div>
            )}
          </div>
        )}
      </motion.div>

      <Dialog
        open={!!bulkAction}
        onOpenChange={(open) => !open && setBulkAction(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("adminEntreprises.bulkDialogTitle")}</DialogTitle>
            <DialogDescription>
              {t(
                checkedEffectif.size > 1
                  ? "adminEntreprises.bulkDialogDescPlural"
                  : "adminEntreprises.bulkDialogDescSingular",
                {
                  action: bulkLabels[bulkAction] || bulkAction,
                  n: checkedEffectif.size,
                },
              )}
              {bulkAction === "rejeter" &&
                ` ${t("adminEntreprises.bulkRejectMotifRequired")}`}
            </DialogDescription>
          </DialogHeader>
          {bulkAction === "rejeter" && (
            <div className="space-y-2 py-2">
              <label htmlFor="bulk-motif" className="text-sm font-medium">
                {t("adminEntreprises.motifLabel")}{" "}
                <span className="text-destructive">*</span>
              </label>
              <textarea
                id="bulk-motif"
                value={bulkMotif}
                onChange={(e) => setBulkMotif(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                placeholder={t("adminEntreprises.motifPlaceholder")}
              />
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setBulkAction(null)}
              disabled={bulkMutation.isPending}
            >
              {t("adminEntreprises.cancel")}
            </Button>
            <Button
              type="button"
              variant={
                bulkAction === "rejeter" || bulkAction === "suspendre"
                  ? "destructive"
                  : "default"
              }
              disabled={
                bulkMutation.isPending ||
                (bulkAction === "rejeter" && bulkMotif.trim().length < 5)
              }
              onClick={confirmBulk}
            >
              {t("adminEntreprises.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function OverviewStat({ value, label }) {
  return (
    <div>
      <p className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
