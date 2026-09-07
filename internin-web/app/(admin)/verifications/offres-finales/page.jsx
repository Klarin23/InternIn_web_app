"use client";

/**
 * Admin → Offres de stage (offres finales) — Marketplace Control / Validation Center
 * Refonte UI/UX uniquement. Hooks, API, validation approuve/rejete conservés.
 *
 * Données : idOffreFinale, numero, intitulePoste, nomEntreprise, secteurActivite,
 * departement, prenom/nomStagiaire, dateDebut, dureeStage, modeTravail,
 * remunerationType, volumeHoraireHebdo, objectifsApprentissage, dateCreation,
 * dateValidation, statutValidationPlateforme, enRetard, heuresEcoulees,
 * delaiTraitementHeures
 *
 * Statuts : en_attente | approuve | rejete (+ filtre en_retard)
 */

import { useEffect, useMemo, useState } from "react";
import {
  FiLoader,
  FiCheck,
  FiX,
  FiInbox,
  FiBriefcase,
  FiUser,
  FiCalendar,
  FiClock,
  FiSearch,
  FiAlertCircle,
  FiMapPin,
} from "react-icons/fi";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import AppHeader from "@/components/layout/AppHeader";
import AdminPageHeader from "@/components/layout/AdminPageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  useOffresFinalesAdmin,
  useValiderOffreFinale,
} from "@/lib/queries/useOffresFinales";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/useTranslation";

const DUREE_LABEL_KEYS = {
  "1_mois": "adminOffresFinales.duree1Mois",
  "2_mois": "adminOffresFinales.duree2Mois",
  "3_mois": "adminOffresFinales.duree3Mois",
};

const MODE_LABEL_KEYS = {
  presentiel: "adminOffresFinales.modePresentiel",
  remote: "adminOffresFinales.modeRemote",
  hybride: "adminOffresFinales.modeHybride",
};

const REMUNERATION_LABEL_KEYS = {
  non_remunere: "adminOffresFinales.remunerationNonRemunere",
  gratification: "adminOffresFinales.remunerationGratification",
  salaire: "adminOffresFinales.remunerationSalaire",
};

const STATUT_META = {
  en_attente: {
    labelKey: "adminOffresFinales.statusEnAttente",
    dot: "bg-amber-500",
    text: "text-amber-800 dark:text-amber-300",
    soft: "bg-amber-500/10 border-amber-500/15",
  },
  approuve: {
    labelKey: "adminOffresFinales.statusApprouve",
    dot: "bg-emerald-500",
    text: "text-emerald-800 dark:text-emerald-300",
    soft: "bg-emerald-500/10 border-emerald-500/15",
  },
  rejete: {
    labelKey: "adminOffresFinales.statusRejete",
    dot: "bg-red-500",
    text: "text-red-700 dark:text-red-400",
    soft: "bg-red-500/10 border-red-500/15",
  },
};

const ONGLET_DEFS = [
  { value: "toutes", labelKey: "adminOffresFinales.filterAll" },
  { value: "en_attente", labelKey: "adminOffresFinales.filterPending" },
  { value: "en_retard", labelKey: "adminOffresFinales.filterOverdue" },
  { value: "approuve", labelKey: "adminOffresFinales.filterApproved" },
  { value: "rejete", labelKey: "adminOffresFinales.filterRejected" },
];

function formatDate(date, t) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString(t("adminOffresFinales.localeDate"), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date, t) {
  if (!date) return "—";
  return new Date(date).toLocaleString(t("adminOffresFinales.localeDate"), {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRef(numero) {
  return `OFF-${String(numero).padStart(4, "0")}`;
}

function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function StatusPill({ statut }) {
  const { t } = useTranslation();
  const meta = STATUT_META[statut] || STATUT_META.en_attente;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        meta.soft,
        meta.text,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} aria-hidden />
      {t(meta.labelKey)}
    </span>
  );
}

function Pipeline({ statut }) {
  const { t } = useTranslation();
  const steps = [
    { key: "draft", label: t("adminOffresFinales.pipelineDraft") },
    { key: "en_attente", label: t("adminOffresFinales.pipelineReview") },
    { key: "approuve", label: t("adminOffresFinales.pipelineApproved") },
  ];
  let activeIdx = 1;
  if (statut === "approuve") activeIdx = 2;
  if (statut === "rejete") activeIdx = 1;
  return (
    <div className="flex items-center gap-1.5">
      {steps.map((s, i) => {
        const done = i < activeIdx || (statut === "approuve" && i <= 2);
        const current = i === activeIdx && statut !== "approuve";
        const rejected = statut === "rejete" && i === 1;
        return (
          <div key={s.key} className="flex items-center gap-1.5">
            {i > 0 && (
              <span
                className={cn(
                  "h-px w-4 sm:w-6",
                  rejected
                    ? "bg-red-500/40"
                    : done || current
                      ? "bg-teal-500/50"
                      : "bg-border",
                )}
              />
            )}
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold",
                rejected
                  ? "bg-red-500/15 text-red-600 dark:text-red-400"
                  : done
                    ? "bg-teal-600 text-white dark:bg-teal-500"
                    : current
                      ? "border border-amber-500/50 bg-amber-500/10 text-amber-800 dark:text-amber-300"
                      : "border border-border text-muted-foreground",
              )}
            >
              {done && !rejected ? "✓" : i + 1}
            </span>
            <span
              className={cn(
                "hidden text-[10px] font-medium sm:inline",
                rejected
                  ? "text-red-600 dark:text-red-400"
                  : done || current
                    ? "text-foreground"
                    : "text-muted-foreground",
              )}
            >
              {s.label}
            </span>
          </div>
        );
      })}
      {statut === "rejete" && (
        <span className="ml-1 text-[10px] font-semibold text-red-600 dark:text-red-400">
          {t("adminOffresFinales.statusRejete")}
        </span>
      )}
    </div>
  );
}

export default function VerificationsOffresFinalesPage() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const {
    data: offresAll,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useOffresFinalesAdmin(undefined);
  const mutation = useValiderOffreFinale();

  const [onglet, setOnglet] = useState("en_attente");
  const [search, setSearch] = useState("");
  const searchDebounced = useDebounced(search, 280);
  const [selectedId, setSelectedId] = useState(null);
  const [confirmRejet, setConfirmRejet] = useState(false);
  const [mobileDetail, setMobileDetail] = useState(false);

  const ONGLETS = ONGLET_DEFS.map((o) => ({ ...o, label: t(o.labelKey) }));

  const counts = useMemo(() => {
    const list = offresAll || [];
    return {
      toutes: list.length,
      en_attente: list.filter((o) => o.statutValidationPlateforme === "en_attente")
        .length,
      en_retard: list.filter((o) => o.enRetard).length,
      approuve: list.filter((o) => o.statutValidationPlateforme === "approuve")
        .length,
      rejete: list.filter((o) => o.statutValidationPlateforme === "rejete")
        .length,
    };
  }, [offresAll]);

  const filtered = useMemo(() => {
    let list = offresAll || [];
    if (onglet === "en_retard") {
      list = list.filter((o) => o.enRetard);
    } else if (onglet !== "toutes") {
      list = list.filter((o) => o.statutValidationPlateforme === onglet);
    }
    const q = searchDebounced.trim().toLowerCase();
    if (q) {
      list = list.filter((o) => {
        const hay = [
          o.intitulePoste,
          o.nomEntreprise,
          o.secteurActivite,
          o.departement,
          o.prenomStagiaire,
          o.nomStagiaire,
          o.numero != null ? formatRef(o.numero) : "",
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }
    return list;
  }, [offresAll, onglet, searchDebounced]);

  const selectedIdEffectif = useMemo(() => {
    if (!filtered.length) return null;
    if (
      selectedId != null &&
      filtered.some((o) => o.idOffreFinale === selectedId)
    ) {
      return selectedId;
    }
    return filtered[0]?.idOffreFinale ?? null;
  }, [filtered, selectedId]);

  const selected = useMemo(
    () => filtered.find((o) => o.idOffreFinale === selectedIdEffectif) || null,
    [filtered, selectedIdEffectif],
  );

  function approuver() {
    if (!selected || mutation.isPending) return;
    mutation.mutate({
      id: selected.idOffreFinale,
      statutValidationPlateforme: "approuve",
    });
  }

  function confirmerRejet() {
    if (!selected || mutation.isPending) return;
    mutation.mutate(
      {
        id: selected.idOffreFinale,
        statutValidationPlateforme: "rejete",
      },
      {
        onSettled: () => setConfirmRejet(false),
      },
    );
  }

  function selectOffer(id) {
    setSelectedId(id);
    setMobileDetail(true);
  }

  return (
    <>
      <AppHeader
        breadcrumb={[
          { label: t("adminOffresFinales.breadcrumbAdmin") },
          { label: t("adminOffresFinales.breadcrumbMarketplace") },
        ]}
        refreshKeys={["offresFinalesAdmin", "adminStats"]}
      />

      <motion.div
        className="space-y-6 px-4 py-5 sm:px-6"
        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <AdminPageHeader
          context={t("adminOffresFinales.context")}
          title={t("adminOffresFinales.title")}
          description={t("adminOffresFinales.description")}
          metadata={
            <>
              <span className="font-semibold text-amber-700 dark:text-amber-400">
                {counts.en_attente}
              </span>{" "}
              {t("adminOffresFinales.pending")}
              {counts.en_retard > 0 && (
                <>
                  {" "}
                  ·{" "}
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    {counts.en_retard}
                  </span>{" "}
                  {t("adminOffresFinales.overdue")}
                </>
              )}
              {isFetching && !isLoading && ` · ${t("adminOffresFinales.updating")}`}
            </>
          }
        />

        {/* Overview */}
        <div className="rounded-xl border border-border/80 bg-card px-5 py-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {t("adminOffresFinales.overviewTitle")}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
            <OverviewStat
              value={counts.toutes}
              label={t("adminOffresFinales.statTotal")}
              tone="teal"
            />
            <OverviewStat
              value={counts.en_attente}
              label={t("adminOffresFinales.statPendingApproval")}
              tone="amber"
            />
            <OverviewStat
              value={counts.en_retard}
              label={t("adminOffresFinales.statOverdue")}
              tone="red"
            />
            <OverviewStat
              value={counts.approuve}
              label={t("adminOffresFinales.statApproved")}
              tone="green"
            />
            <OverviewStat
              value={counts.rejete}
              label={t("adminOffresFinales.statRejected")}
              tone="red"
            />
          </div>
        </div>

        {/* Search + filters */}
        <div className="space-y-3">
          <div className="relative">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("adminOffresFinales.searchPlaceholder")}
              className="h-11 w-full rounded-lg border border-border bg-card pl-10 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-teal-500/35 focus-visible:border-teal-500/30"
            />
          </div>
          <div
            className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-card p-1"
            role="tablist"
          >
            {ONGLETS.map((o) => {
              const active = onglet === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setOnglet(o.value)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-semibold transition",
                    active
                      ? o.value === "en_retard"
                        ? "bg-red-500/15 text-red-700 dark:text-red-300"
                        : o.value === "en_attente"
                          ? "bg-amber-500/15 text-amber-800 dark:text-amber-300"
                          : o.value === "approuve"
                            ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                            : o.value === "rejete"
                              ? "bg-red-500/15 text-red-700 dark:text-red-300"
                              : "bg-teal-500/15 text-teal-800 dark:text-teal-300"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {o.label}
                  <span
                    className={cn(
                      "ml-1.5 tabular-nums",
                      active ? "opacity-70" : "opacity-50",
                    )}
                  >
                    {counts[o.value] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error */}
        {isError && (
          <div className="rounded-xl border border-red-500/25 bg-red-500/6 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {t("adminOffresFinales.loadError")}
            <button
              type="button"
              onClick={() => refetch()}
              className="ml-2 font-semibold underline underline-offset-2"
            >
              {t("adminOffresFinales.retry")}
            </button>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2 px-4 py-3.5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-3 w-40" />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && filtered.length === 0 && (
          <div className="rounded-lg border border-border bg-card px-6 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10">
              <FiInbox className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            </div>
            <p className="mt-3 text-sm font-semibold text-foreground">
              {(offresAll || []).length === 0
                ? t("adminOffresFinales.emptyTitleNone")
                : t("adminOffresFinales.emptyTitleFiltered")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {(offresAll || []).length === 0
                ? t("adminOffresFinales.emptyDescNone")
                : t("adminOffresFinales.emptyDescFiltered")}
            </p>
            {(search || onglet !== "toutes") && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setSearch("");
                  setOnglet("toutes");
                }}
              >
                {t("adminOffresFinales.clearFilters")}
              </Button>
            )}
          </div>
        )}

        {/* List + detail */}
        {!isLoading && !isError && filtered.length > 0 && (
          <div className="grid grid-cols-1 overflow-hidden rounded-xl border border-border/80 shadow-sm lg:grid-cols-[minmax(0,1fr)_minmax(320px,600px)]">
            <div
              className={cn(
                "min-h-0 border-border bg-card lg:border-r",
                mobileDetail && "hidden lg:block",
              )}
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {t("adminOffresFinales.listingsTitle")}
                </p>
                <p className="text-[11px] tabular-nums text-muted-foreground">
                  {t("adminOffresFinales.listingsCount", {
                    shown: filtered.length,
                    total: counts.toutes,
                  })}
                </p>
              </div>
              <ul className="max-h-[min(70vh,720px)] divide-y divide-border overflow-y-auto">
                {filtered.map((o) => {
                  const active = o.idOffreFinale === selectedIdEffectif;
                  const closed =
                    o.statutValidationPlateforme === "approuve" ||
                    o.statutValidationPlateforme === "rejete";
                  return (
                    <li key={o.idOffreFinale}>
                      <button
                        type="button"
                        onClick={() => selectOffer(o.idOffreFinale)}
                        className={cn(
                          "flex w-full flex-col gap-1.5 px-4 py-3.5 text-left transition hover:bg-muted/30",
                          active && "bg-teal-500/6 ring-1 ring-inset ring-teal-500/15",
                          closed && "opacity-75",
                          o.enRetard && !active && "bg-amber-500/5",
                        )}
                      >
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="font-mono text-[10px] font-medium tracking-wide text-muted-foreground">
                            {formatRef(o.numero)}
                          </span>
                          <StatusPill statut={o.statutValidationPlateforme} />
                          {o.enRetard && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-1.5 py-0.5 text-[11px] font-medium text-red-700 dark:text-red-400">
                              <FiAlertCircle className="h-3 w-3" />
                              {t("adminOffresFinales.overdue")}
                            </span>
                          )}
                          <span className="ml-auto text-[11px] text-muted-foreground">
                            {formatDate(o.dateCreation, t)}
                          </span>
                        </div>
                        <p className="truncate text-sm font-semibold text-foreground">
                          {o.intitulePoste || t("adminOffresFinales.defaultOfferTitle")}
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-muted-foreground">
                          <span>
                            <span className="text-muted-foreground/70">
                              {t("adminOffresFinales.companyLabel")}{" "}
                            </span>
                            <span className="text-foreground/80">
                              {o.nomEntreprise || "—"}
                            </span>
                          </span>
                          {(o.prenomStagiaire || o.nomStagiaire) && (
                            <span>
                              <span className="text-muted-foreground/70">
                                {t("adminOffresFinales.studentLabel")}{" "}
                              </span>
                              <span className="text-foreground/80">
                                {[o.prenomStagiaire, o.nomStagiaire]
                                  .filter(Boolean)
                                  .join(" ")}
                              </span>
                            </span>
                          )}
                          {o.departement && (
                            <span className="inline-flex items-center gap-0.5">
                              <FiMapPin className="h-3 w-3" />
                              {o.departement}
                            </span>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Detail panel */}
            <div
              className={cn(
                "min-h-0 bg-card",
                !mobileDetail && "hidden lg:block",
              )}
            >
              <AnimatePresence mode="wait">
                {selected ? (
                  <motion.div
                    key={selected.idOffreFinale}
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={reduceMotion ? undefined : { opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex max-h-[min(70vh,720px)] flex-col"
                  >
                    <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3.5">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                          {t("adminOffresFinales.listingReview")}
                        </p>
                        <p className="mt-1 font-mono text-xs text-muted-foreground">
                          {formatRef(selected.numero)}
                        </p>
                        <h3 className="mt-1 text-base font-semibold leading-snug text-foreground">
                          {selected.intitulePoste}
                        </h3>
                        <div className="mt-2">
                          <StatusPill
                            statut={selected.statutValidationPlateforme}
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMobileDetail(false)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted lg:hidden"
                        aria-label={t("adminOffresFinales.close")}
                      >
                        <FiX className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
                      <section>
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                          {t("adminOffresFinales.publicationPipeline")}
                        </p>
                        <Pipeline statut={selected.statutValidationPlateforme} />
                      </section>

                      <div className="grid gap-2.5">
                        <DetailRow
                          icon={FiBriefcase}
                          label={t("adminOffresFinales.companyLabel")}
                          value={selected.nomEntreprise || "—"}
                        />
                        <DetailRow
                          icon={FiUser}
                          label={t("adminOffresFinales.studentLabel")}
                          value={
                            selected.prenomStagiaire
                              ? `${selected.prenomStagiaire} ${selected.nomStagiaire || ""}`.trim()
                              : "—"
                          }
                        />
                        <DetailRow
                          icon={FiCalendar}
                          label={t("adminOffresFinales.colStartDate")}
                          value={formatDate(selected.dateDebut, t)}
                        />
                        <DetailRow
                          icon={FiClock}
                          label={t("adminOffresFinales.colDuration")}
                          value={
                            (DUREE_LABEL_KEYS[selected.dureeStage] &&
                              t(DUREE_LABEL_KEYS[selected.dureeStage])) ||
                            selected.dureeStage ||
                            "—"
                          }
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <Meta
                          label={t("adminOffresFinales.colWorkMode")}
                          value={
                            (MODE_LABEL_KEYS[selected.modeTravail] &&
                              t(MODE_LABEL_KEYS[selected.modeTravail])) ||
                            selected.modeTravail ||
                            "—"
                          }
                        />
                        <Meta
                          label={t("adminOffresFinales.colCompensation")}
                          value={
                            (REMUNERATION_LABEL_KEYS[selected.remunerationType] &&
                              t(REMUNERATION_LABEL_KEYS[selected.remunerationType])) ||
                            selected.remunerationType ||
                            "—"
                          }
                        />
                        <Meta
                          label={t("adminOffresFinales.colHoursWeek")}
                          value={
                            selected.volumeHoraireHebdo
                              ? `${selected.volumeHoraireHebdo} h`
                              : "—"
                          }
                        />
                        <Meta
                          label={t("adminOffresFinales.colDepartment")}
                          value={
                            [selected.secteurActivite, selected.departement]
                              .filter(Boolean)
                              .join(" · ") || "—"
                          }
                        />
                      </div>

                      {selected.objectifsApprentissage && (
                        <section>
                          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                            {t("adminOffresFinales.learningObjectives")}
                          </p>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                            {selected.objectifsApprentissage}
                          </p>
                        </section>
                      )}

                      <section className="text-xs text-muted-foreground">
                        <p>
                          {t("adminOffresFinales.submittedPrefix", {
                            date: formatDateTime(selected.dateCreation, t),
                          })}
                          {selected.enRetard
                            ? t("adminOffresFinales.overdueSlaSuffix", {
                                elapsed: selected.heuresEcoulees,
                                sla: selected.delaiTraitementHeures,
                              })
                            : selected.statutValidationPlateforme ===
                                "en_attente" && selected.delaiTraitementHeures
                              ? t("adminOffresFinales.slaSuffix", {
                                  sla: selected.delaiTraitementHeures,
                                })
                              : ""}
                        </p>
                        {selected.dateValidation && (
                          <p className="mt-1">
                            {selected.statutValidationPlateforme === "approuve"
                              ? t("adminOffresFinales.approvedOn")
                              : t("adminOffresFinales.rejectedOn")}{" "}
                            {formatDateTime(selected.dateValidation, t)}
                          </p>
                        )}
                      </section>

                      {selected.statutValidationPlateforme === "en_attente" && (
                        <section className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5">
                          <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-800 dark:text-amber-300">
                            {t("adminOffresFinales.decisionTitle")}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {t("adminOffresFinales.decisionHint")}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              disabled={mutation.isPending}
                              onClick={approuver}
                              className="h-9 gap-1.5 bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-500"
                            >
                              {mutation.isPending ? (
                                <FiLoader className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <FiCheck className="h-3.5 w-3.5" />
                              )}
                              {t("adminOffresFinales.approveBtn")}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={mutation.isPending}
                              onClick={() => setConfirmRejet(true)}
                              className="h-9 gap-1.5"
                            >
                              <FiX className="h-3.5 w-3.5" />
                              {t("adminOffresFinales.rejectBtn")}
                            </Button>
                          </div>
                        </section>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                    {t("adminOffresFinales.selectListing")}
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </motion.div>

      <Dialog open={confirmRejet} onOpenChange={setConfirmRejet}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("adminOffresFinales.confirmRejectTitle")}</DialogTitle>
            <DialogDescription>
              {t("adminOffresFinales.confirmRejectDesc", {
                name: selected
                  ? `« ${selected.intitulePoste} »`
                  : t("adminOffresFinales.thisOffer"),
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmRejet(false)}
              disabled={mutation.isPending}
            >
              {t("adminOffresFinales.cancelBtn")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmerRejet}
              disabled={mutation.isPending}
              className="gap-1.5"
            >
              {mutation.isPending ? (
                <FiLoader className="h-4 w-4 animate-spin" />
              ) : (
                <FiX className="h-4 w-4" />
              )}
              {t("adminOffresFinales.confirmRejectBtn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

const OVERVIEW_TONES = {
  teal: {
    icon: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
    hint: "text-teal-700 dark:text-teal-400",
  },
  amber: {
    icon: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    hint: "text-amber-700 dark:text-amber-400",
  },
  green: {
    icon: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    hint: "text-emerald-700 dark:text-emerald-400",
  },
  red: {
    icon: "bg-red-500/10 text-red-600 dark:text-red-400",
    hint: "text-red-700 dark:text-red-400",
  },
  purple: {
    icon: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    hint: "text-violet-700 dark:text-violet-400",
  },
  neutral: {
    icon: "bg-muted text-muted-foreground",
    hint: "text-muted-foreground",
  },
};

function OverviewStat({ value, label, tone = "neutral" }) {
  const t = OVERVIEW_TONES[tone] || OVERVIEW_TONES.neutral;
  return (
    <div className="min-w-0">
      <span
        className={cn(
          "mb-2 inline-flex h-1.5 w-1.5 rounded-full",
          tone === "teal" && "bg-teal-500",
          tone === "amber" && "bg-amber-500",
          tone === "green" && "bg-emerald-500",
          tone === "red" && "bg-red-500",
          tone === "purple" && "bg-violet-500",
          tone === "neutral" && "bg-muted-foreground/40",
        )}
        aria-hidden
      />
      <p className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5 rounded-md border border-border px-3 py-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
