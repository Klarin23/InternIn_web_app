"use client";

import Link from "next/link";
import { useState } from "react";
import {
  FiAlertCircle,
  FiArrowRight,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiEye,
  FiPlus,
  FiRefreshCw,
  FiUsers,
} from "react-icons/fi";
import AppHeader from "@/components/layout/AppHeader";
import { useMonProfilEquipe } from "@/lib/queries/useEquipe";
import { useMembrePermissions } from "@/lib/queries/useMembrePermissions";
import { useRecruitmentDashboardSection } from "@/lib/queries/useRecruitmentDashboard";
import { useTranslation } from "@/lib/i18n/useTranslation";

const NUMBER_FORMAT = new Intl.NumberFormat();

function Panel({ title, action, children, className = "" }) {
  return (
    <section
      className={`min-w-0 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5 ${className}`}
      aria-labelledby={`recrutement-${title}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2
          id={`recrutement-${title}`}
          className="text-base font-semibold text-foreground sm:text-lg"
        >
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function SectionLoading({ label }) {
  return (
    <div className="space-y-3" role="status" aria-busy="true">
      <span className="sr-only">{label}</span>
      <div className="h-4 w-3/5 animate-pulse rounded bg-muted motion-reduce:animate-none" />
      <div className="h-12 animate-pulse rounded-xl bg-muted motion-reduce:animate-none" />
      <div className="h-12 animate-pulse rounded-xl bg-muted motion-reduce:animate-none" />
    </div>
  );
}

function SectionError({ label, onRetry, t }) {
  return (
    <div className="rounded-xl border border-destructive/25 bg-destructive/5 p-4">
      <div className="flex items-start gap-2 text-sm text-foreground">
        <FiAlertCircle
          className="mt-0.5 size-4 shrink-0 text-destructive"
          aria-hidden="true"
        />
        <p>{t("recrutementDashboard.sectionError", { section: label })}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 rounded-md text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {t("recrutementDashboard.retry")}
      </button>
    </div>
  );
}

function DashboardLink({ href, children, icon: Icon = FiArrowRight }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {children}
      <Icon className="size-4" aria-hidden="true" />
    </Link>
  );
}

function Metric({ icon: Icon, label, value, detail, href }) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">
        {NUMBER_FORMAT.format(value)}
      </p>
      {detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}
    </>
  );

  return href ? (
    <Link
      href={href}
      className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {content}
    </Link>
  ) : (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      {content}
    </div>
  );
}

function formatRelativeDate(value, locale, now) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const deltaSeconds = Math.round((date.getTime() - now) / 1000);
  const absSeconds = Math.abs(deltaSeconds);
  const unit =
    absSeconds < 60
      ? "second"
      : absSeconds < 3600
        ? "minute"
        : absSeconds < 86400
          ? "hour"
          : "day";
  const divisor =
    unit === "second"
      ? 1
      : unit === "minute"
        ? 60
        : unit === "hour"
          ? 3600
          : 86400;
  return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(
    Math.round(deltaSeconds / divisor),
    unit,
  );
}

function formatInterviewTime(value, locale) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, {
    timeZone: "Africa/Douala",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function actionLabel(action, t) {
  const knownActionKeys = {
    candidature_envoyee: "activity.applicationReceived",
    candidature_remise_attente: "activity.applicationReopened",
    profil_consulte: "activity.profileViewed",
    candidat_preselectionne: "activity.candidateShortlisted",
    candidature_refusee: "activity.applicationDeclined",
    candidature_acceptee: "activity.applicationAccepted",
    cv_telecharge: "activity.resumeViewed",
    evaluation_maj: "activity.evaluationUpdated",
    note_ajoutee: "activity.noteAdded",
  };
  const key = knownActionKeys[action];
  return key ? t(`recrutementDashboard.${key}`) : t("recrutementDashboard.activityUpdated");
}

export default function RecrutementDashboardContent() {
  const { t, locale } = useTranslation();
  const { data: profil } = useMonProfilEquipe();
  const { has } = useMembrePermissions();
  const [agendaTab, setAgendaTab] = useState("today");
  const [now] = useState(() => Date.now());

  const peutOffres = has("offres.gerer");
  const verificationOk = profil?.statutVerification === "verifiee";
  const peutCandidats = has("candidats.gerer") && verificationOk;
  const peutEntretiens = has("entretiens.gerer") && verificationOk;
  const accesStageEnAttente =
    !verificationOk &&
    (has("candidats.gerer") || has("entretiens.gerer"));
  const aUnAcces =
    peutOffres || peutCandidats || peutEntretiens || accesStageEnAttente;

  const offersQuery = useRecruitmentDashboardSection("offers", peutOffres);
  const applicationsQuery = useRecruitmentDashboardSection(
    "applications",
    peutCandidats,
  );
  const interviewsQuery = useRecruitmentDashboardSection(
    "interviews",
    peutEntretiens,
  );

  const offers = offersQuery.data;
  const applications = applicationsQuery.data;
  const interviews = interviewsQuery.data;
  const prenom = profil?.prenom || profil?.nom?.split?.(" ")?.[0] || "";
  const dateLocale = locale?.startsWith("en") ? "en" : "fr";
  const agendaItems =
    agendaTab === "today"
      ? interviews?.todayItems || []
      : interviews?.upcomingItems || [];
  const prioritiesResolved =
    (!peutCandidats ||
      applicationsQuery.isError ||
      (!!applications && (applications.sectionErrors?.counts || applications.needsReview !== null))) &&
    (!peutEntretiens ||
      interviewsQuery.isError ||
      (!!interviews && (interviews.sectionErrors?.summary || interviews.today !== null)));
  const interviewsByOffer = new Map(
    (interviews?.interviewsByOffer || []).map((item) => [
      item.idOffre,
      item.count,
    ]),
  );
  const isRefreshing =
    (peutOffres && offersQuery.isFetching) ||
    (peutCandidats && applicationsQuery.isFetching) ||
    (peutEntretiens && interviewsQuery.isFetching);

  function refreshDashboard() {
    if (peutOffres) void offersQuery.refetch();
    if (peutCandidats) void applicationsQuery.refetch();
    if (peutEntretiens) void interviewsQuery.refetch();
  }

  const priorities = [
    applications?.needsReview > 0 && {
      id: "applications",
      icon: FiUsers,
      label: t("recrutementDashboard.priorityApplications", {
        count: applications.needsReview,
      }),
      href: "/candidats",
      level: "high",
    },
    interviews?.needsAction > 0 && {
      id: "rescheduling",
      icon: FiClock,
      label: t("recrutementDashboard.priorityRescheduling", {
        count: interviews.needsAction,
      }),
      href: "/candidats",
      level: "high",
    },
    interviews?.today > 0 && {
      id: "interviewsToday",
      icon: FiCalendar,
      label: t("recrutementDashboard.priorityInterviewsToday", {
        count: interviews.today,
      }),
      href: "/entretiens-entreprise",
      level: "normal",
    },
  ].filter(Boolean);

  const summaryParts = [];
  if (
    peutCandidats &&
    applications &&
    !applicationsQuery.isError &&
    !applications.sectionErrors?.counts
  ) {
    summaryParts.push(
      t("recrutementDashboard.summaryApplications", {
        count: applications.needsReview,
      }),
    );
  }
  if (
    peutEntretiens &&
    interviews &&
    !interviewsQuery.isError &&
    !interviews.sectionErrors?.summary
  ) {
    summaryParts.push(
      t("recrutementDashboard.summaryInterviews", {
        count: interviews.today,
      }),
    );
  }

  const title = t("recrutementDashboard.title");

  return (
    <>
      <AppHeader
        title={title}
        subtitle={t("recrutementDashboard.subtitle")}
        refreshKeys={["recrutementDashboard"]}
      />
      <main className="w-full space-y-5 px-4 py-5 sm:space-y-6 sm:px-6 sm:py-6 lg:px-8">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {prenom
                  ? t("recrutementDashboard.greeting", { name: prenom })
                  : t("recrutementDashboard.greetingFallback")}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {summaryParts.length
                  ? summaryParts.join(" · ")
                  : t("recrutementDashboard.summaryFallback")}
              </p>
            </div>
            {aUnAcces && (
              <div
                className="flex flex-wrap gap-2"
                aria-label={t("recrutementDashboard.quickActions")}
              >
                {(peutOffres || peutCandidats || peutEntretiens) && (
                  <button
                    type="button"
                    onClick={refreshDashboard}
                    disabled={isRefreshing}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-wait disabled:opacity-60"
                  >
                    <FiRefreshCw
                      className={`size-4 ${isRefreshing ? "animate-spin motion-reduce:animate-none" : ""}`}
                      aria-hidden="true"
                    />
                    {t(
                      isRefreshing
                        ? "recrutementDashboard.refreshing"
                        : "recrutementDashboard.refresh",
                    )}
                  </button>
                )}
                {peutOffres && (
                  <DashboardLink href="/offres-entreprise" icon={FiPlus}>
                    {t("recrutementDashboard.createOffer")}
                  </DashboardLink>
                )}
                {peutCandidats && (
                  <DashboardLink href="/candidats" icon={FiUsers}>
                    {t("recrutementDashboard.reviewCandidates")}
                  </DashboardLink>
                )}
                {peutEntretiens && (
                  <DashboardLink href="/entretiens-entreprise" icon={FiCalendar}>
                    {t("recrutementDashboard.openAgenda")}
                  </DashboardLink>
                )}
              </div>
            )}
          </div>
        </section>

        {!aUnAcces && (
          <section className="rounded-2xl border border-border bg-card px-5 py-8 text-center">
            <p className="text-sm font-semibold text-foreground">
              {t("recrutementDashboard.noAccessTitle")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("recrutementDashboard.noAccessHint")}
            </p>
          </section>
        )}

        {aUnAcces && (
          <>
            {accesStageEnAttente && (
              <div
                className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-foreground"
                role="status"
              >
                <FiAlertCircle className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden="true" />
                <p>{t("recrutementDashboard.verificationRequired")}</p>
              </div>
            )}
            <section
              className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
              aria-label={t("recrutementDashboard.operationalMetrics")}
            >
              {peutOffres &&
                (offersQuery.isLoading ? (
                  <div key="offers-loading" className="rounded-2xl border border-border bg-card p-4"><SectionLoading label={t("recrutementDashboard.loading")} /></div>
                ) : offersQuery.isError ? (
                  <div key="offers-error" className="rounded-2xl border border-border bg-card p-4"><SectionError label={t("recrutementDashboard.offers")} onRetry={offersQuery.refetch} t={t} /></div>
                ) : offers ? (
                  <Metric
                    key="offers"
                    icon={FiBriefcase}
                    label={t("recrutementDashboard.activeOffers")}
                    value={offers.active}
                    detail={t("recrutementDashboard.offersTotal", {
                      count: offers.total,
                    })}
                    href="/offres-entreprise"
                  />
                ) : null)}
              {peutCandidats &&
                (applicationsQuery.isLoading ? (
                  <div key="applications-loading" className="rounded-2xl border border-border bg-card p-4"><SectionLoading label={t("recrutementDashboard.loading")} /></div>
                ) : applicationsQuery.isError || applications?.sectionErrors?.counts ? (
                  <div key="applications-error" className="rounded-2xl border border-border bg-card p-4"><SectionError label={t("recrutementDashboard.applications")} onRetry={applicationsQuery.refetch} t={t} /></div>
                ) : applications ? (
                  <Metric
                    key="applications"
                    icon={FiUsers}
                    label={t("recrutementDashboard.toReview")}
                    value={applications.needsReview}
                    detail={t("recrutementDashboard.applicationsTotal", {
                      count: applications.total,
                    })}
                    href="/candidats"
                  />
                ) : null)}
              {peutEntretiens &&
                (interviewsQuery.isLoading ? (
                  <div key="interviews-loading" className="rounded-2xl border border-border bg-card p-4"><SectionLoading label={t("recrutementDashboard.loading")} /></div>
                ) : interviewsQuery.isError || interviews?.sectionErrors?.summary ? (
                  <div key="interviews-error" className="rounded-2xl border border-border bg-card p-4"><SectionError label={t("recrutementDashboard.interviews")} onRetry={interviewsQuery.refetch} t={t} /></div>
                ) : interviews ? (
                  <Metric
                    key="interviews"
                    icon={FiCalendar}
                    label={t("recrutementDashboard.upcomingInterviews")}
                    value={interviews.upcoming}
                    detail={t("recrutementDashboard.interviewsToday", {
                      count: interviews.today,
                    })}
                    href="/entretiens-entreprise"
                  />
                ) : null)}
              {peutCandidats &&
                !applicationsQuery.isLoading &&
                !applicationsQuery.isError &&
                applications && (
                  applications.sectionErrors?.finalOffers ? (
                    <div key="final-offers-error" className="rounded-2xl border border-border bg-card p-4">
                      <SectionError label={t("recrutementDashboard.finalOffersWaiting")} onRetry={applicationsQuery.refetch} t={t} />
                    </div>
                  ) : (
                    <Metric
                      key="final-offers"
                      icon={FiCheckCircle}
                      label={t("recrutementDashboard.finalOffersWaiting")}
                      value={applications.finalOffersWaiting}
                      detail={t("recrutementDashboard.finalOffersAccepted", {
                        count: applications.finalOffersAccepted,
                      })}
                      href="/entretiens-entreprise"
                    />
                  )
                )}
            </section>

            {(peutCandidats || peutEntretiens) && (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]">
                {peutCandidats && (
                  <Panel
                    title={t("recrutementDashboard.pipeline")}
                    action={
                      <DashboardLink href="/candidats">
                        {t("recrutementDashboard.viewCandidates")}
                      </DashboardLink>
                    }
                  >
                    {applicationsQuery.isLoading ? (
                      <SectionLoading label={t("recrutementDashboard.loading")} />
                    ) : applicationsQuery.isError || applications?.sectionErrors?.counts ? (
                      <SectionError
                        label={t("recrutementDashboard.pipeline")}
                        onRetry={applicationsQuery.refetch}
                        t={t}
                      />
                    ) : applications ? (
                      <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                        <PipelineStage label={t("recrutementDashboard.stageReceived")} value={applications.total} />
                        <PipelineStage label={t("recrutementDashboard.stageToReview")} value={applications.needsReview} />
                        <PipelineStage label={t("recrutementDashboard.stageShortlisted")} value={applications.preselected} />
                        {peutEntretiens &&
                          interviews &&
                          !interviews.sectionErrors?.summary && (
                          <PipelineStage label={t("recrutementDashboard.stageInterview")} value={interviews.interviewedCandidates} />
                        )}
                        {!applications.sectionErrors?.finalOffers && (
                          <>
                            <PipelineStage label={t("recrutementDashboard.stageFinalOffers")} value={applications.finalOffersWaiting + applications.finalOffersAccepted} />
                            <PipelineStage label={t("recrutementDashboard.stageAccepted")} value={applications.finalOffersAccepted} />
                          </>
                        )}
                      </ol>
                    ) : null}
                  </Panel>
                )}

                <Panel
                  title={t("recrutementDashboard.priorities")}
                  className="h-full"
                >
                  {priorities.length ? (
                    <>
                      <ul className="space-y-3">
                        {priorities.map((item) => {
                          const Icon = item.icon;
                          return (
                            <li key={item.id}>
                              <Link
                                href={item.href}
                                className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-border bg-background p-3 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                              >
                                <span className="flex min-w-0 items-center gap-3">
                                  <Icon
                                    className={`size-4 shrink-0 ${item.level === "high" ? "text-destructive" : "text-primary"}`}
                                    aria-hidden="true"
                                  />
                                  <span className="text-sm font-medium text-foreground">
                                    {item.label}
                                  </span>
                                </span>
                                <FiArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                      {(applications?.sectionErrors?.counts ||
                        interviews?.sectionErrors?.summary) && (
                        <p className="mt-3 text-xs text-muted-foreground">
                          {t("recrutementDashboard.priorityDataUnavailable")}
                        </p>
                      )}
                    </>
                  ) : (
                    !prioritiesResolved ? (
                      <SectionLoading label={t("recrutementDashboard.loading")} />
                    ) :                     applicationsQuery.isError ||
                    interviewsQuery.isError ||
                    applications?.sectionErrors?.counts ||
                    interviews?.sectionErrors?.summary ? (
                      <p className="text-sm text-muted-foreground">{t("recrutementDashboard.priorityDataUnavailable")}</p>
                    ) : (
                      (applications || interviews) && (
                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                          <FiCheckCircle className="size-4 text-primary" aria-hidden="true" />
                          {t("recrutementDashboard.allClear")}
                        </p>
                      )
                    )
                  )}
                </Panel>
              </div>
            )}

            {(peutCandidats || peutEntretiens) && (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {peutCandidats && (
                  <Panel
                    title={t("recrutementDashboard.candidatesToReview")}
                    action={
                      <DashboardLink href="/candidats">
                        {t("recrutementDashboard.viewAll")}
                      </DashboardLink>
                    }
                  >
                    {applicationsQuery.isLoading ? (
                      <SectionLoading label={t("recrutementDashboard.loading")} />
                    ) : applicationsQuery.isError || applications?.sectionErrors?.reviewItems ? (
                      <SectionError
                        label={t("recrutementDashboard.applications")}
                        onRetry={applicationsQuery.refetch}
                        t={t}
                      />
                    ) : applications?.reviewItems.length ? (
                      <ul className="divide-y divide-border">
                        {applications.reviewItems.map((item) => (
                          <li
                            key={item.idCandidature}
                            className="flex flex-col gap-3 py-3 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-foreground">
                                {item.prenom} {item.nom}
                              </p>
                              <p className="truncate text-sm text-muted-foreground">
                                {item.titreOffre}
                              </p>
                              <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-foreground">
                                  {t(`applicationStatus.${item.statut}`)}
                                </span>
                                <time dateTime={item.dateCandidature}>
                                  {formatRelativeDate(item.dateCandidature, dateLocale, now)}
                                </time>
                              </p>
                            </div>
                            <DashboardLink
                              href={`/candidats?idOffre=${encodeURIComponent(item.idOffre)}`}
                              icon={FiEye}
                            >
                              {t("recrutementDashboard.reviewAction")}
                            </DashboardLink>
                          </li>
                        ))}
                      </ul>
                    ) : applications ? (
                      <EmptyState
                        icon={FiCheckCircle}
                        message={t("recrutementDashboard.noApplicationsToReview")}
                      />
                    ) : null}
                  </Panel>
                )}

                {peutEntretiens && (
                  <Panel
                    title={t("recrutementDashboard.agenda")}
                    action={
                      <DashboardLink href="/entretiens-entreprise">
                        {t("recrutementDashboard.viewAll")}
                      </DashboardLink>
                    }
                  >
                    {interviewsQuery.isLoading ? (
                      <SectionLoading label={t("recrutementDashboard.loading")} />
                    ) : interviewsQuery.isError ||
                      interviews?.sectionErrors?.[agendaTab === "today" ? "todayItems" : "upcomingItems"] ? (
                      <SectionError
                        label={t("recrutementDashboard.interviews")}
                        onRetry={interviewsQuery.refetch}
                        t={t}
                      />
                    ) : interviews ? (
                      <>
                        <div
                          className="mb-3 flex gap-2"
                          role="group"
                          aria-label={t("recrutementDashboard.agendaFilters")}
                        >
                          <AgendaTab
                            active={agendaTab === "today"}
                            onClick={() => setAgendaTab("today")}
                          >
                            {t("recrutementDashboard.today")}
                          </AgendaTab>
                          <AgendaTab
                            active={agendaTab === "upcoming"}
                            onClick={() => setAgendaTab("upcoming")}
                          >
                            {t("recrutementDashboard.upcoming")}
                          </AgendaTab>
                        </div>
                        {agendaItems.length ? (
                          <ul className="space-y-2">
                            {agendaItems.map((item) => (
                              <li
                                key={item.idEntretien}
                                className="rounded-xl border border-border bg-background p-3"
                              >
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-foreground">
                                      {item.prenom} {item.nom}
                                    </p>
                                    <p className="truncate text-sm text-muted-foreground">
                                      {item.titreOffre}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <FiClock className="size-4" aria-hidden="true" />
                                    <time dateTime={item.dateHeure}>
                                      {formatInterviewTime(item.dateHeure, dateLocale)}
                                    </time>
                                  </div>
                                </div>
                                <p className="mt-2 text-xs font-medium text-muted-foreground">
                                  {t(`interviews.status.${item.statut}`)}
                                </p>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <EmptyState
                            icon={FiCalendar}
                            message={
                              agendaTab === "today"
                                ? t("recrutementDashboard.noInterviewsToday")
                                : t("recrutementDashboard.noUpcomingInterviews")
                            }
                          />
                        )}
                      </>
                    ) : null}
                  </Panel>
                )}
              </div>
            )}

            {peutCandidats && (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <Panel title={t("recrutementDashboard.offerPerformance")}>
                  {applicationsQuery.isLoading ? (
                    <SectionLoading label={t("recrutementDashboard.loading")} />
                  ) : applicationsQuery.isError || applications?.sectionErrors?.offerPerformance ? (
                    <SectionError
                      label={t("recrutementDashboard.offerPerformance")}
                      onRetry={applicationsQuery.refetch}
                      t={t}
                    />
                  ) : applications?.offerPerformance?.length ? (
                    <ul className="space-y-3">
                      {applications.offerPerformance.map((offer) => (
                        <li
                          key={offer.idOffre}
                          className="rounded-xl border border-border bg-background p-3"
                        >
                          <Link
                            href={`/candidats?idOffre=${encodeURIComponent(offer.idOffre)}`}
                            className="font-semibold text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          >
                            {offer.titre}
                          </Link>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span>
                              {t("recrutementDashboard.performanceApplications", {
                                count: offer.applications,
                              })}
                            </span>
                            <span>
                              {t("recrutementDashboard.performanceShortlisted", {
                                count: offer.preselected,
                              })}
                            </span>
                            {peutEntretiens &&
                              interviews &&
                              !interviews.sectionErrors?.interviewsByOffer && (
                              <span>
                                {t("recrutementDashboard.performanceInterviews", {
                                  count: interviewsByOffer.get(offer.idOffre) ?? 0,
                                })}
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : applications?.offerPerformance ? (
                    <EmptyState
                      icon={FiBriefcase}
                      message={t("recrutementDashboard.noPublishedOffers")}
                    />
                  ) : null}
                  {peutEntretiens &&
                    interviews?.sectionErrors?.interviewsByOffer && (
                      <div className="mt-3">
                        <SectionError
                          label={t("recrutementDashboard.interviews")}
                          onRetry={interviewsQuery.refetch}
                          t={t}
                        />
                      </div>
                    )}
                </Panel>

                <Panel title={t("recrutementDashboard.recentActivity")}>
                  {applicationsQuery.isLoading ? (
                    <SectionLoading label={t("recrutementDashboard.loading")} />
                  ) : applicationsQuery.isError || applications?.sectionErrors?.activity ? (
                    <SectionError
                      label={t("recrutementDashboard.recentActivity")}
                      onRetry={applicationsQuery.refetch}
                      t={t}
                    />
                  ) : applications?.activity?.length ? (
                    <ul className="space-y-3">
                      {applications.activity.map((item) => (
                        <li
                          key={item.idActivite}
                          className="flex items-start gap-3"
                        >
                          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <FiUsers className="size-4" aria-hidden="true" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">
                              {actionLabel(item.action, t)}
                            </p>
                            <Link
                              href={`/candidats?idOffre=${encodeURIComponent(item.idOffre)}`}
                              className="block truncate text-sm text-muted-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                              {item.prenom} {item.nom} · {item.titreOffre}
                            </Link>
                            <time
                              dateTime={item.dateAction}
                              className="mt-0.5 block text-xs text-muted-foreground"
                            >
                              {formatRelativeDate(item.dateAction, dateLocale, now)}
                            </time>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : applications?.activity ? (
                    <EmptyState
                      icon={FiClock}
                      message={t("recrutementDashboard.noRecentActivity")}
                    />
                  ) : null}
                </Panel>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}

function PipelineStage({ label, value }) {
  return (
    <li className="rounded-xl border border-border bg-background p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold text-foreground">
        {NUMBER_FORMAT.format(value)}
      </p>
    </li>
  );
}

function EmptyState({ icon: Icon, message }) {
  return (
    <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center">
      <Icon className="mx-auto size-5 text-muted-foreground" aria-hidden="true" />
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function AgendaTab({ active, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-10 rounded-lg px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        active
          ? "bg-primary text-primary-foreground"
          : "border border-border bg-background text-foreground hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}
