"use client";

/**
 * Admin → Universités — University Partnership & Oversight Center
 * Refonte UI/UX. Hooks, vérification, suspend/réactiver, export conservés.
 *
 * Données liste : idUniversite, nomUniversite, emailOfficiel, pays,
 * statutVerification, statutCompte, nbDocuments, dateCreation
 */

import { useEffect, useMemo, useState } from "react";
import {
  FiSearch,
  FiDownload,
  FiAlertTriangle,
  FiCheck,
  FiLoader,
  FiX,
} from "react-icons/fi";
import { FaGraduationCap } from "react-icons/fa6";
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
import UniversiteFiltresTabs from "@/components/features/gestion-universites/UniversiteFiltresTabs";
import { useToutesUniversites } from "@/lib/queries/useToutesUniversites";
import { useChangerStatutCompteUniversite } from "@/lib/queries/useChangerStatutCompteUniversite";
import { useVerifierUniversite } from "@/lib/queries/useVerifierUniversite";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/useTranslation";

function getBadge(u) {
  if (u.statutCompte === "suspendu") {
    return {
      labelKey: "statusRestricted",
      dot: "bg-destructive",
      text: "text-destructive",
    };
  }
  if (u.statutVerification === "verifiee") {
    return {
      labelKey: "statusVerified",
      dot: "bg-emerald-500",
      text: "text-emerald-700 dark:text-emerald-400",
    };
  }
  if (u.statutVerification === "rejetee") {
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

function codeUniversite(id) {
  return `UNI-${String(id || "").replace(/-/g, "").slice(0, 4).toUpperCase()}`;
}

function formatDate(date, t) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString(t("adminUniversites.localeDate"), {
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

function initials(name) {
  if (!name) return "U";
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function exportCsv(rows, t) {
  const headers = [
    t("adminUniversites.csvCode"),
    t("adminUniversites.csvName"),
    t("adminUniversites.csvEmail"),
    t("adminUniversites.csvCountry"),
    t("adminUniversites.csvVerificationStatus"),
    t("adminUniversites.csvAccountStatus"),
    t("adminUniversites.csvDocuments"),
    t("adminUniversites.csvCreatedDate"),
  ];
  const lines = [headers.join(";")];
  for (const u of rows) {
    lines.push(
      [
        codeUniversite(u.idUniversite),
        u.nomUniversite,
        u.emailOfficiel,
        u.pays,
        u.statutVerification,
        u.statutCompte,
        u.nbDocuments ?? 0,
        u.dateCreation ? new Date(u.dateCreation).toISOString() : "",
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
  a.download = `universites-internin-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function StatusPill({ badge }) {
  const { t } = useTranslation();
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", badge.text)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", badge.dot)} />
      {t(`adminUniversites.${badge.labelKey}`)}
    </span>
  );
}

function UniversiteRow({ universite, isActive, onSelect }) {
  const { t } = useTranslation();
  const badge = getBadge(universite);
  return (
    <button
      type="button"
      onClick={() => onSelect(universite.idUniversite)}
      className={cn(
        "flex w-full gap-3 border-b border-border px-4 py-3.5 text-left transition last:border-b-0",
        isActive ? "bg-muted/50" : "hover:bg-muted/30",
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-bold text-muted-foreground">
        {initials(universite.nomUniversite)}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <p className="truncate text-sm font-semibold text-foreground">
            {universite.nomUniversite}
          </p>
          <StatusPill badge={badge} />
        </div>
        <p className="truncate text-[11px] text-muted-foreground">
          {[universite.emailOfficiel, universite.pays].filter(Boolean).join(" · ") ||
            "—"}
        </p>
        <div className="flex flex-wrap gap-x-3 text-[11px] text-muted-foreground">
          <span className="font-mono tracking-wide">
            {codeUniversite(universite.idUniversite)}
          </span>
          <span>
            <span className="text-muted-foreground/70">
              {t("adminUniversites.rowDocsLabel")}{" "}
            </span>
            <span className="text-foreground/80">{universite.nbDocuments ?? 0}</span>
          </span>
          <span>
            {t("adminUniversites.joinedPrefix", {
              date: formatDate(universite.dateCreation, t),
            })}
          </span>
        </div>
      </div>
    </button>
  );
}

function DetailPanel({ universite, verifierMutation, statutMutation }) {
  const { t } = useTranslation();
  const [confirm, setConfirm] = useState(null);
  const badge = getBadge(universite);
  const id = universite.idUniversite;
  const isPending =
    (verifierMutation.isPending && verifierMutation.variables?.id === id) ||
    (statutMutation.isPending && statutMutation.variables?.id === id);

  function run() {
    if (confirm === "verifiee" || confirm === "rejetee") {
      verifierMutation.mutate(
        { id, statutVerification: confirm },
        { onSettled: () => setConfirm(null) },
      );
    } else if (confirm === "suspendu" || confirm === "actif") {
      statutMutation.mutate(
        { id, statutCompte: confirm },
        { onSettled: () => setConfirm(null) },
      );
    }
  }

  return (
    <div className="flex max-h-[min(70vh,720px)] flex-col">
      <div className="border-b border-border px-4 py-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {t("adminUniversites.panelEyebrow")}
        </p>
        <div className="mt-2 flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-bold text-muted-foreground">
            {initials(universite.nomUniversite)}
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold leading-snug text-foreground">
              {universite.nomUniversite}
            </h2>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
              {codeUniversite(id)}
            </p>
            <div className="mt-1.5">
              <StatusPill badge={badge} />
            </div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {universite.statutVerification !== "verifiee" &&
            universite.statutCompte !== "suspendu" && (
              <Button
                type="button"
                size="sm"
                disabled={isPending}
                onClick={() => setConfirm("verifiee")}
                className="h-8 gap-1"
              >
                <FiCheck className="h-3.5 w-3.5" />
                {t("adminUniversites.btnVerify")}
              </Button>
            )}
          {universite.statutVerification !== "rejetee" &&
            universite.statutCompte !== "suspendu" && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => setConfirm("rejetee")}
                className="h-8 gap-1"
              >
                <FiX className="h-3.5 w-3.5" />
                {t("adminUniversites.btnReject")}
              </Button>
            )}
          {universite.statutCompte === "suspendu" ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => setConfirm("actif")}
              className="h-8"
            >
              {t("adminUniversites.btnReactivate")}
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => setConfirm("suspendu")}
              className="h-8"
            >
              {t("adminUniversites.btnRestrict")}
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            {t("adminUniversites.sectionInstitutionInfo")}
          </p>
          <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <Info label={t("adminUniversites.fieldOfficialEmail")} value={universite.emailOfficiel || "—"} />
            <Info label={t("adminUniversites.fieldCountry")} value={universite.pays || "—"} />
            <Info label={t("adminUniversites.fieldMemberSince")} value={formatDate(universite.dateCreation, t)} />
            <Info
              label={t("adminUniversites.fieldDocumentsSubmitted")}
              value={String(universite.nbDocuments ?? 0)}
            />
            <Info label={t("adminUniversites.fieldAccountStatus")} value={universite.statutCompte || "—"} />
            <Info
              label={t("adminUniversites.fieldVerification")}
              value={universite.statutVerification || "—"}
            />
          </div>
        </section>
      </div>

      <Dialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirm === "verifiee" && t("adminUniversites.confirmVerifyTitle")}
              {confirm === "rejetee" && t("adminUniversites.confirmRejectTitle")}
              {confirm === "suspendu" && t("adminUniversites.confirmSuspendTitle")}
              {confirm === "actif" && t("adminUniversites.confirmReactivateTitle")}
            </DialogTitle>
            <DialogDescription>{universite.nomUniversite}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirm(null)}
              disabled={isPending}
            >
              {t("adminUniversites.cancel")}
            </Button>
            <Button
              type="button"
              variant={
                confirm === "rejetee" || confirm === "suspendu"
                  ? "destructive"
                  : "default"
              }
              onClick={run}
              disabled={isPending}
              className="gap-1.5"
            >
              {isPending && <FiLoader className="h-4 w-4 animate-spin" />}
              {t("adminUniversites.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-md border border-border px-3 py-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="truncate text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

export default function GestionUniversitesPage() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [recherche, setRecherche] = useState("");
  const rechercheDebounced = useDebounced(recherche, 300);
  const [filtre, setFiltre] = useState("tous");
  const [selectedId, setSelectedId] = useState(null);

  const {
    data: universites,
    isLoading,
    isError,
    isFetching,
    refetch,
    error,
  } = useToutesUniversites(rechercheDebounced);
  const verifierMutation = useVerifierUniversite();
  const statutMutation = useChangerStatutCompteUniversite();

  const counts = useMemo(() => {
    const list = universites || [];
    return {
      tous: list.length,
      en_attente: list.filter(
        (u) =>
          u.statutVerification === "en_attente" &&
          u.statutCompte !== "suspendu",
      ).length,
      verifiee: list.filter(
        (u) =>
          u.statutVerification === "verifiee" && u.statutCompte !== "suspendu",
      ).length,
      rejetee: list.filter(
        (u) =>
          u.statutVerification === "rejetee" && u.statutCompte !== "suspendu",
      ).length,
      suspendu: list.filter((u) => u.statutCompte === "suspendu").length,
    };
  }, [universites]);

  const filtrees = useMemo(() => {
    const list = universites || [];
    if (filtre === "tous") return list;
    if (filtre === "suspendu") {
      return list.filter((u) => u.statutCompte === "suspendu");
    }
    return list.filter(
      (u) =>
        u.statutVerification === filtre && u.statutCompte !== "suspendu",
    );
  }, [universites, filtre]);

  const selectedIdEffectif = useMemo(() => {
    if (!filtrees.length) return null;
    if (
      selectedId != null &&
      filtrees.some((u) => u.idUniversite === selectedId)
    ) {
      return selectedId;
    }
    return filtrees[0]?.idUniversite ?? null;
  }, [filtrees, selectedId]);

  const selected =
    filtrees.find((u) => u.idUniversite === selectedIdEffectif) || null;

  return (
    <>
      <AppHeader
        breadcrumb={[
          { label: t("adminUniversites.breadcrumbAdmin") },
          { label: t("adminUniversites.breadcrumbInstitutions") },
        ]}
        refreshKeys={["toutesUniversites", "adminStats"]}
      />

      <motion.div
        className="space-y-6 px-4 py-5 sm:px-6"
        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <AdminPageHeader
          context={t("adminUniversites.context")}
          title={t("adminUniversites.title")}
          description={t("adminUniversites.description")}
          metadata={<>
              <span className="font-semibold text-foreground">{counts.en_attente}</span>{" "}
              {t("adminUniversites.pendingVerification")}
              {counts.suspendu > 0 && (
                <> · <span className="font-semibold text-foreground">{counts.suspendu}</span>{" "}
                  {t("adminUniversites.restricted")}</>
              )}
              {isFetching && !isLoading && ` · ${t("adminUniversites.updating")}`}
            </>}
          actions={<Button type="button" variant="outline" size="sm" className="h-9 gap-1.5 text-xs font-semibold" disabled={!filtrees.length} onClick={() => exportCsv(filtrees, t)}>
              <FiDownload className="h-3.5 w-3.5" />
              {t("adminUniversites.exportCsv")}
              {filtrees.length ? ` (${filtrees.length})` : ""}
            </Button>}
        />

        {(counts.en_attente > 0 || counts.suspendu > 0) && (
          <div className="rounded-lg border border-border bg-card px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              {t("adminUniversites.needsAttention")}
            </p>
            <p className="mt-1.5 text-sm text-foreground">
              {counts.en_attente > 0 && (
                <span>
                  {t(
                    counts.en_attente > 1
                      ? "adminUniversites.universityAwaitingPlural"
                      : "adminUniversites.universityAwaitingSingular",
                    { n: counts.en_attente },
                  )}
                </span>
              )}
              {counts.en_attente > 0 && counts.suspendu > 0 && " · "}
              {counts.suspendu > 0 && (
                <span>
                  {t(
                    counts.suspendu > 1
                      ? "adminUniversites.restrictedAccountPlural"
                      : "adminUniversites.restrictedAccountSingular",
                    { n: counts.suspendu },
                  )}
                </span>
              )}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <div className="relative">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder={t("adminUniversites.searchPlaceholder")}
              className="h-11 w-full rounded-lg border border-border bg-card pl-10 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/30"
            />
          </div>
          <UniversiteFiltresTabs
            value={filtre}
            onChange={setFiltre}
            counts={counts}
          />
        </div>

        {isError && (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 py-12 text-center">
            <FiAlertTriangle className="h-6 w-6 text-destructive" />
            <p className="text-sm font-semibold">
              {error?.message || t("adminUniversites.loadError")}
            </p>
            <Button type="button" size="sm" variant="outline" onClick={() => refetch()}>
              {t("adminUniversites.retry")}
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 overflow-hidden rounded-lg border border-border lg:grid-cols-[minmax(0,420px)_1fr]">
            <div className="divide-y divide-border">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2 px-4 py-3.5">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-40" />
                </div>
              ))}
            </div>
            <Skeleton className="min-h-[320px]" />
          </div>
        )}

        {!isLoading && !isError && filtrees.length === 0 && (
          <div className="rounded-lg border border-border bg-card px-6 py-16 text-center">
            <FaGraduationCap className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-semibold text-foreground">
              {(universites || []).length === 0
                ? t("adminUniversites.emptyTitleNone")
                : t("adminUniversites.emptyTitleFiltered")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("adminUniversites.emptyDesc")}
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
                {t("adminUniversites.clearFilters")}
              </Button>
            )}
          </div>
        )}

        {!isLoading && !isError && filtrees.length > 0 && (
          <div className="grid grid-cols-1 overflow-hidden rounded-lg border border-border lg:grid-cols-[minmax(0,420px)_1fr]">
            <div className="border-border bg-card lg:border-r">
              <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  {t("adminUniversites.listHeader")}
                </p>
                <p className="text-[11px] tabular-nums text-muted-foreground">
                  {t("adminUniversites.listCount", {
                    shown: filtrees.length,
                    total: counts.tous,
                  })}
                </p>
              </div>
              <div className="max-h-[min(70vh,720px)] overflow-y-auto">
                {filtrees.map((u) => (
                  <UniversiteRow
                    key={u.idUniversite}
                    universite={u}
                    isActive={selected?.idUniversite === u.idUniversite}
                    onSelect={setSelectedId}
                  />
                ))}
              </div>
            </div>
            {selected && (
              <div className="min-h-0 bg-card">
                <DetailPanel
                  universite={selected}
                  verifierMutation={verifierMutation}
                  statutMutation={statutMutation}
                />
              </div>
            )}
          </div>
        )}
      </motion.div>
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
