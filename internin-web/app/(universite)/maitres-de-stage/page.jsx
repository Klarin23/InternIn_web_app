"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiBriefcase,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiLoader,
  FiMapPin,
  FiRefreshCw,
  FiSearch,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import AppHeader from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  useMaitreDeStageUniversiteDetail,
  useMaitresDeStageUniversite,
} from "@/lib/queries/useMaitresDeStageUniversite";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

function initiales(nom) {
  const mots = String(nom || "").trim().split(/\s+/).filter(Boolean);
  return ((mots[0]?.[0] || "?") + (mots[1]?.[0] || "")).toUpperCase();
}

function statutClass(statut) {
  if (statut === "actif") return "bg-teal-500/10 text-teal-700 dark:text-teal-300";
  if (statut === "invite") return "bg-amber-500/10 text-amber-700 dark:text-amber-300";
  return "bg-muted text-muted-foreground";
}

function stageStatusClass(statut) {
  if (statut === "actif") return "bg-teal-500/10 text-teal-700 dark:text-teal-300";
  if (statut === "interrompu") return "bg-destructive/10 text-destructive";
  if (statut === "termine") return "bg-muted text-muted-foreground";
  return "bg-amber-500/10 text-amber-700 dark:text-amber-300";
}

function formatDate(value, locale) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date);
}

function Kpi({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-border/80 bg-card px-4 py-3.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </p>
        <Icon className="h-4 w-4 text-muted-foreground/70" aria-hidden />
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-foreground">
        {value ?? 0}
      </p>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-2 p-4" aria-hidden>
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="h-14 rounded-lg bg-muted/60" />
      ))}
    </div>
  );
}

function EmptyState({ hasFilters, onReset, t }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <FiUsers className="h-5 w-5" aria-hidden />
      </div>
      <p className="mt-4 text-sm font-semibold text-foreground">
        {hasFilters ? t("universiteSpace.supervisors.emptySearch") : t("universiteSpace.supervisors.empty")}
      </p>
      <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
        {hasFilters
          ? t("universiteSpace.supervisors.emptySearchDescription")
          : t("universiteSpace.supervisors.emptyDescription")}
      </p>
      {hasFilters ? (
        <Button type="button" variant="outline" size="sm" className="mt-4" onClick={onReset}>
          {t("universiteSpace.supervisors.resetFilters")}
        </Button>
      ) : null}
    </div>
  );
}

function StatusBadge({ statut, t }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold", statutClass(statut))}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {t(`universiteSpace.supervisors.status.${statut}`)}
    </span>
  );
}

function SupervisorRow({ item, onOpen, t }) {
  return (
    <tr className="border-b border-border/50 last:border-0 hover:bg-muted/25">
      <td className="px-4 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-500/10 text-xs font-bold text-teal-700 dark:text-teal-300">
            {initiales(item.nom)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{item.nom}</p>
            <p className="truncate text-xs text-muted-foreground">
              {t(`universiteSpace.supervisors.roles.${item.roleEquipe}`)}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{item.entreprise?.nomEntreprise || "—"}</p>
          {item.entreprise?.ville ? (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <FiMapPin className="h-3 w-3" aria-hidden />
              {item.entreprise.ville}
            </p>
          ) : null}
        </div>
      </td>
      <td className="px-4 py-3.5 text-center text-sm font-semibold tabular-nums text-foreground">{item.stagiairesActuels}</td>
      <td className="px-4 py-3.5 text-center text-sm font-semibold tabular-nums text-foreground">{item.totalStages}</td>
      <td className="px-4 py-3.5"><StatusBadge statut={item.statutMembre} t={t} /></td>
      <td className="px-4 py-3.5 text-right">
        <Button type="button" variant="outline" size="sm" onClick={() => onOpen(item.idMembre)}>
          {t("universiteSpace.supervisors.viewProfile")}
        </Button>
      </td>
    </tr>
  );
}

function SupervisorCard({ item, onOpen, t }) {
  return (
    <article className="rounded-xl border border-border/80 bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-500/10 text-xs font-bold text-teal-700 dark:text-teal-300">
          {initiales(item.nom)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{item.nom}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {t(`universiteSpace.supervisors.roles.${item.roleEquipe}`)}
              </p>
            </div>
            <StatusBadge statut={item.statutMembre} t={t} />
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <FiBriefcase className="h-3.5 w-3.5" aria-hidden />
            <span className="truncate">{item.entreprise?.nomEntreprise || "—"}</span>
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-muted/40 px-3 py-2">
              <p className="text-sm font-bold tabular-nums text-foreground">{item.stagiairesActuels}</p>
              <p className="text-[10px] text-muted-foreground">{t("universiteSpace.supervisors.currentStudents")}</p>
            </div>
            <div className="rounded-lg bg-muted/40 px-3 py-2">
              <p className="text-sm font-bold tabular-nums text-foreground">{item.totalStages}</p>
              <p className="text-[10px] text-muted-foreground">{t("universiteSpace.supervisors.totalStages")}</p>
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" className="mt-3 w-full" onClick={() => onOpen(item.idMembre)}>
            {t("universiteSpace.supervisors.viewProfile")}
          </Button>
        </div>
      </div>
    </article>
  );
}

function StageItem({ stage, t, locale }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <FiUser className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {stage.stagiaire.prenom} {stage.stagiaire.nom}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {stage.stagiaire.formation || t("universiteSpace.supervisors.formationUnavailable")}
            </p>
          </div>
        </div>
        <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold", stageStatusClass(stage.statutStage))}>
          {t(`universiteSpace.supervisors.stageStatus.${stage.statutStage}`)}
        </span>
      </div>
      <div className="mt-4 grid gap-3 text-xs text-muted-foreground sm:grid-cols-3">
        <div>
          <p className="font-medium text-foreground">{t("universiteSpace.supervisors.stagePeriod")}</p>
          <p className="mt-1">{formatDate(stage.dateDebut, locale)} → {formatDate(stage.dateFinPrevue, locale)}</p>
        </div>
        <div>
          <p className="font-medium text-foreground">{t("universiteSpace.supervisors.company")}</p>
          <p className="mt-1 truncate">{stage.entreprise?.nomEntreprise || "—"}</p>
        </div>
        <div>
          <p className="font-medium text-foreground">{t("universiteSpace.supervisors.progress")}</p>
          <p className="mt-1">{stage.progressionPourcentage != null ? `${stage.progressionPourcentage}%` : "—"}</p>
        </div>
      </div>
    </div>
  );
}

function DetailDialog({ idMembre, open, onOpenChange, t, locale }) {
  const { data, isLoading, isError, refetch } = useMaitreDeStageUniversiteDetail(idMembre);
  const detail = data?.maitre;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-3xl">
        <DialogHeader className="pr-8">
          <DialogTitle>{detail?.nom || t("universiteSpace.supervisors.profileTitle")}</DialogTitle>
          <DialogDescription>{t("universiteSpace.supervisors.profileDescription")}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3 py-6 animate-pulse" aria-hidden>
            <div className="h-20 rounded-xl bg-muted" />
            <div className="h-28 rounded-xl bg-muted" />
            <div className="h-28 rounded-xl bg-muted" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center py-10 text-center">
            <FiAlertCircle className="h-6 w-6 text-destructive" aria-hidden />
            <p className="mt-3 text-sm font-medium text-foreground">{t("universiteSpace.supervisors.detailError")}</p>
            <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
              <FiRefreshCw className="h-4 w-4" aria-hidden />
              {t("universiteSpace.supervisors.retry")}
            </Button>
          </div>
        ) : detail ? (
          <div className="space-y-5">
            <section className="rounded-xl border border-border/70 bg-muted/20 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-500/10 font-semibold text-teal-700 dark:text-teal-300">
                  {initiales(detail.nom)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-semibold text-foreground">{detail.nom}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t(`universiteSpace.supervisors.roles.${detail.roleEquipe}`)} · {detail.entreprise?.nomEntreprise || "—"}
                  </p>
                </div>
                <StatusBadge statut={detail.statutMembre} t={t} />
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{t("universiteSpace.supervisors.currentSupervision")}</h3>
                  <p className="text-xs text-muted-foreground">{t("universiteSpace.supervisors.currentSupervisionDescription")}</p>
                </div>
                <span className="text-xs font-semibold tabular-nums text-muted-foreground">{data.encadrementActuel?.length || 0}</span>
              </div>
              {data.encadrementActuel?.length ? (
                <div className="space-y-2.5">{data.encadrementActuel.map((stage) => <StageItem key={stage.idStage} stage={stage} t={t} locale={locale} />)}</div>
              ) : (
                <div className="rounded-xl border border-dashed border-border p-5 text-center text-xs text-muted-foreground">
                  {t("universiteSpace.supervisors.noCurrentStudents")}
                </div>
              )}
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{t("universiteSpace.supervisors.history")}</h3>
                  <p className="text-xs text-muted-foreground">{t("universiteSpace.supervisors.historyDescription")}</p>
                </div>
                <span className="text-xs font-semibold tabular-nums text-muted-foreground">{data.historique?.length || 0}</span>
              </div>
              {data.historique?.length ? (
                <div className="space-y-2.5">{data.historique.map((stage) => <StageItem key={stage.idStage} stage={stage} t={t} locale={locale} />)}</div>
              ) : (
                <div className="rounded-xl border border-dashed border-border p-5 text-center text-xs text-muted-foreground">
                  {t("universiteSpace.supervisors.noHistory")}
                </div>
              )}
            </section>

            <section className="rounded-xl border border-border/70 p-4">
              <div className="flex items-center gap-2">
                <FiClock className="h-4 w-4 text-muted-foreground" aria-hidden />
                <h3 className="text-sm font-semibold text-foreground">{t("universiteSpace.supervisors.evaluations")}</h3>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-muted/40 p-3"><p className="text-lg font-bold tabular-nums text-foreground">{data.resumeEvaluations?.realisees ?? 0}</p><p className="text-[10px] text-muted-foreground">{t("universiteSpace.supervisors.evaluationsDone")}</p></div>
                <div className="rounded-lg bg-muted/40 p-3"><p className="text-lg font-bold tabular-nums text-foreground">{data.resumeEvaluations?.enAttente ?? 0}</p><p className="text-[10px] text-muted-foreground">{t("universiteSpace.supervisors.evaluationsPending")}</p></div>
                <div className="rounded-lg bg-muted/40 p-3"><p className="text-lg font-bold tabular-nums text-foreground">{data.resumeEvaluations?.enRetard ?? 0}</p><p className="text-[10px] text-muted-foreground">{t("universiteSpace.supervisors.evaluationsLate")}</p></div>
              </div>
              {data.resumeEvaluations?.derniere ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  {t("universiteSpace.supervisors.lastEvaluation")}: {formatDate(data.resumeEvaluations.derniere.dateSoumission, locale)}
                </p>
              ) : null}
            </section>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export default function MaitresStagePage() {
  const { t, locale } = useTranslation();
  const [searchInput, setSearchInput] = useState("");
  const [recherche, setRecherche] = useState("");
  const [entreprise, setEntreprise] = useState("all");
  const [statut, setStatut] = useState("all");
  const [encadrement, setEncadrement] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setRecherche(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [recherche, entreprise, statut, encadrement]);

  const params = useMemo(() => ({
    recherche,
    entreprise: entreprise === "all" ? undefined : entreprise,
    statut: statut === "all" ? undefined : statut,
    encadrement: encadrement === "all" ? undefined : encadrement,
    page,
    parPage: PAGE_SIZE,
    tri: "nom",
    ordre: "asc",
  }), [recherche, entreprise, statut, encadrement, page]);

  const { data, isLoading, isFetching, isError, refetch } = useMaitresDeStageUniversite(params);
  const rows = data?.data || [];
  const pagination = data?.pagination;
  const kpis = data?.kpis;
  const companies = data?.filtres?.entreprises || [];
  const hasFilters = Boolean(recherche || entreprise !== "all" || statut !== "all" || encadrement !== "all");

  const resetFilters = () => {
    setSearchInput("");
    setRecherche("");
    setEntreprise("all");
    setStatut("all");
    setEncadrement("all");
    setPage(1);
  };

  return (
    <>
      <AppHeader
        title={t("universiteSpace.supervisors.title")}
        subtitle={t("universiteSpace.supervisors.subtitle")}
        refreshKeys={["maitresDeStageUniversite"]}
      />

      <div className="space-y-5 px-4 py-5 sm:px-6 sm:py-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi icon={FiUsers} label={t("universiteSpace.supervisors.kpis.activeSupervisors")} value={kpis?.maitresActifs} />
          <Kpi icon={FiUser} label={t("universiteSpace.supervisors.kpis.currentStudents")} value={kpis?.stagiairesActuellementEncadres} />
          <Kpi icon={FiBriefcase} label={t("universiteSpace.supervisors.kpis.companies")} value={kpis?.entreprisesConcernees} />
          <Kpi icon={FiClock} label={t("universiteSpace.supervisors.kpis.evaluations")} value={kpis?.evaluationsASurveiller} />
        </div>

        <section className="rounded-xl border border-border/80 bg-card p-3.5 sm:p-4">
          <div className="grid gap-2.5 lg:grid-cols-[minmax(260px,1fr)_220px_170px_210px]">
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder={t("universiteSpace.supervisors.searchPlaceholder")}
                aria-label={t("universiteSpace.supervisors.searchLabel")}
                className="pl-9"
              />
            </div>
            <Select value={entreprise} onValueChange={setEntreprise}>
              <SelectTrigger className="w-full"><SelectValue placeholder={t("universiteSpace.supervisors.filters.company")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("universiteSpace.supervisors.filters.allCompanies")}</SelectItem>
                {companies.map((company) => <SelectItem key={company.idEntreprise} value={company.idEntreprise}>{company.nomEntreprise}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statut} onValueChange={setStatut}>
              <SelectTrigger className="w-full"><SelectValue placeholder={t("universiteSpace.supervisors.filters.status")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("universiteSpace.supervisors.filters.allStatuses")}</SelectItem>
                <SelectItem value="actif">{t("universiteSpace.supervisors.status.actif")}</SelectItem>
                <SelectItem value="invite">{t("universiteSpace.supervisors.status.invite")}</SelectItem>
                <SelectItem value="desactive">{t("universiteSpace.supervisors.status.desactive")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={encadrement} onValueChange={setEncadrement}>
              <SelectTrigger className="w-full"><SelectValue placeholder={t("universiteSpace.supervisors.filters.supervision")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("universiteSpace.supervisors.filters.allSupervision")}</SelectItem>
                <SelectItem value="actuel">{t("universiteSpace.supervisors.filters.current")}</SelectItem>
                <SelectItem value="aucun">{t("universiteSpace.supervisors.filters.noneCurrent")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-border/80 bg-card">
          <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
            <p className="text-xs text-muted-foreground">
              {pagination?.total != null ? t("universiteSpace.supervisors.resultCount", { count: pagination.total }) : ""}
            </p>
            {isFetching && !isLoading ? <FiLoader className="h-4 w-4 animate-spin text-muted-foreground" aria-label={t("universiteSpace.supervisors.loading")} /> : null}
          </div>

          {isLoading ? <TableSkeleton /> : isError ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <FiAlertCircle className="h-6 w-6 text-destructive" aria-hidden />
              <p className="mt-3 text-sm font-medium text-foreground">{t("universiteSpace.supervisors.loadError")}</p>
              <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
                <FiRefreshCw className="h-4 w-4" aria-hidden />
                {t("universiteSpace.supervisors.retry")}
              </Button>
            </div>
          ) : rows.length === 0 ? (
            <EmptyState hasFilters={hasFilters} onReset={resetFilters} t={t} />
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[820px] border-collapse text-left">
                  <thead className="bg-muted/30">
                    <tr className="border-b border-border/70">
                      <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">{t("universiteSpace.supervisors.headers.supervisor")}</th>
                      <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">{t("universiteSpace.supervisors.headers.company")}</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">{t("universiteSpace.supervisors.headers.students")}</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">{t("universiteSpace.supervisors.headers.stages")}</th>
                      <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">{t("universiteSpace.supervisors.headers.status")}</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">{t("universiteSpace.supervisors.headers.action")}</th>
                    </tr>
                  </thead>
                  <tbody>{rows.map((item) => <SupervisorRow key={item.idMembre} item={item} onOpen={setSelectedId} t={t} />)}</tbody>
                </table>
              </div>
              <div className="grid gap-2.5 p-3 md:hidden">
                {rows.map((item) => <SupervisorCard key={item.idMembre} item={item} onOpen={setSelectedId} t={t} />)}
              </div>
            </>
          )}

          {pagination && pagination.totalPages > 1 ? (
            <div className="flex items-center justify-between gap-3 border-t border-border/70 px-4 py-3">
              <p className="text-xs text-muted-foreground">
                {t("universiteSpace.supervisors.pageOf", { page: pagination.page, total: pagination.totalPages })}
              </p>
              <div className="flex items-center gap-1.5">
                <Button type="button" variant="outline" size="icon-sm" disabled={pagination.page <= 1 || isFetching} onClick={() => setPage((value) => Math.max(1, value - 1))} aria-label={t("universiteSpace.supervisors.previousPage")}>
                  <FiChevronLeft aria-hidden />
                </Button>
                <Button type="button" variant="outline" size="icon-sm" disabled={pagination.page >= pagination.totalPages || isFetching} onClick={() => setPage((value) => Math.min(pagination.totalPages, value + 1))} aria-label={t("universiteSpace.supervisors.nextPage")}>
                  <FiChevronRight aria-hidden />
                </Button>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <DetailDialog
        idMembre={selectedId}
        open={!!selectedId}
        onOpenChange={(open) => { if (!open) setSelectedId(null); }}
        t={t}
        locale={locale === "en" ? "en-US" : "fr-FR"}
      />
    </>
  );
}
