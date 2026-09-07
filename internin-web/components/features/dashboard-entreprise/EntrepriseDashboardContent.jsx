"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

import {
  FiUsers,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiArrowRight,
  FiClipboard,
  FiAlertTriangle,
} from "react-icons/fi";
import Link from "next/link";
import AppHeader from "@/components/layout/AppHeader";
import VerificationBanner from "./VerificationBanner";
import StatCard from "./StatCard";
import CandidaturesLast30JoursChart from "./CandidaturesLast30JoursChart";
import CandidaturesStatusDonut from "./CandidaturesStatusDonut";
import RecentCandidaturesList from "./RecentCandidaturesList";
import UpcomingEntretiensList from "./UpcomingEntretiensList";
import QuickActionsPanel from "./QuickActionsPanel";
import RecentActivityFeed from "./RecentActivityFeed";
import WelcomeBanner from "./WelcomeBanner";
import AttentionCenter from "./AttentionCenter";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { useEntrepriseProfile } from "@/lib/queries/useEntrepriseProfile";
import { useMesOffres } from "@/lib/queries/useMesOffres";
import { useCandidaturesEntreprise } from "@/lib/queries/useCandidaturesEntreprise";
import { useEntretiensEntreprise } from "@/lib/queries/useEntretiens";
import DashboardSkeleton from "./DashboardSkeleton";
import CalendrierWidget from "./CalendrierWidget";
import ProgressionRecrutementsWidget from "./ProgressionRecrutementsWidget";
import CandidatsRecommandesWidget from "./CandidatsRecommandesWidget";
import TimelineWidget from "./TimelineWidget";
import {
  useMesStagiaires,
  useEvaluationsSuperviseur,
} from "@/lib/queries/useSuperviseur";

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function EntrepriseDashboardContent() {
  const { t, locale } = useTranslation();
  const { data: profile, isLoading: profileLoading } = useEntrepriseProfile();
  const { data: offres, isLoading: offresLoading } = useMesOffres();
  const { data: candidatures, isLoading: candidaturesLoading } =
    useCandidaturesEntreprise();
  const { data: entretiens, isLoading: entretiensLoading } =
    useEntretiensEntreprise();
  const { data: stagiairesSupervision } = useMesStagiaires();
  const { data: evaluationsSupervision } = useEvaluationsSuperviseur();

  const isLoading =
    profileLoading || offresLoading || candidaturesLoading || entretiensLoading;

  const offresActives = (offres || []).filter((o) => o.statut === "publie")
    .length;
  const entretiensPlanifies = (entretiens || []).filter(
    (e) => e.statut === "planifie" || e.statut === "confirme",
  ).length;
  const nbStagiaires = Array.isArray(stagiairesSupervision)
    ? stagiairesSupervision.length
    : 0;
  const nbCandidatures = candidatures?.length ?? 0;

  const candidaturesAExaminer = (candidatures || []).filter((c) =>
    ["soumise", "consultee"].includes(c.statut),
  ).length;

  const today = new Date();
  const entretiensAujourdhui = (entretiens || []).filter((e) => {
    if (!e.dateEntretien && !e.dateHeure && !e.date) return false;
    const d = new Date(e.dateEntretien || e.dateHeure || e.date);
    return !Number.isNaN(d.getTime()) && isSameDay(d, today);
  }).length;

  const evalsATraiter = (evaluationsSupervision || []).filter(
    (e) =>
      e.statutAffichage === "a_effectuer" || e.statutAffichage === "en_retard",
  ).length;

  const attentionItems = [
    {
      key: "cand",
      count: candidaturesAExaminer,
      labelKey: candidaturesAExaminer > 1
        ? "entrepriseSpace.dashboard.candToReviewOther"
        : "entrepriseSpace.dashboard.candToReviewOne",
      href: "/candidats",
      icon: FiUsers,
      hint: t("entrepriseSpace.dashboard.newOrUntreated"),
    },
    {
      key: "ent",
      count: entretiensAujourdhui,
      labelKey: entretiensAujourdhui > 1 ? "entrepriseSpace.dashboard.interviewTodayOther" : "entrepriseSpace.dashboard.interviewTodayOne",
      href: "/entretiens-entreprise",
      icon: FiCalendar,
    },
    {
      key: "eval",
      count: evalsATraiter,
      labelKey: evalsATraiter > 1 ? "entrepriseSpace.dashboard.evalInternOther" : "entrepriseSpace.dashboard.evalInternOne",
      href: "/supervision/evaluations",
      icon: FiClipboard,
    },
  ];

  return (
    <>
      <AppHeader
        breadcrumb={[
          { label: profile?.nomEntreprise || t("entrepriseSpace.dashboard.companyFallback") },
          { label: t("entrepriseSpace.dashboard.breadcrumb") },
        ]}
        avatarLabel={profile?.nomEntreprise?.slice(0, 2).toUpperCase()}
        refreshKeys={[
          "mesOffres",
          "candidaturesEntreprise",
          "entretiensEntreprise",
          "notifications",
          "mesStagiaires",
        ]}
      />

      <div className="mx-auto w-full max-w-[1600px] space-y-8 px-4 py-6 sm:px-6">
        {isLoading && <DashboardSkeleton />}

        {profile && (
          <>
            <WelcomeBanner
              nomEntreprise={profile.nomEntreprise}
              stats={{
                offres: offresActives,
                candidatures: nbCandidatures,
                entretiens: entretiensPlanifies,
              }}
            />

            <VerificationBanner statut={profile.statutVerification} />

            {/* KPI */}
            <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StaggerItem className="h-full">
                <StatCard
                  icon={FiBriefcase}
                  value={offresActives}
                  label={t("entrepriseSpace.dashboard.publishedOffers")}
                  sublabel={t("entrepriseSpace.dashboard.ofTotal", { count: offres?.length ?? 0 })}
                  color="bg-secondary-foreground/10 text-secondary-foreground"
                />
              </StaggerItem>
              <StaggerItem className="h-full">
                <StatCard
                  icon={FiUsers}
                  value={nbCandidatures}
                  label={t("entrepriseSpace.dashboard.applicationsReceived")}
                  color="bg-primary/10 text-primary"
                  highlight
                />
              </StaggerItem>
              <StaggerItem className="h-full">
                <StatCard
                  icon={FiCalendar}
                  value={entretiensPlanifies}
                  label={t("entrepriseSpace.dashboard.interviewsScheduled")}
                  color="bg-accent/40 text-amber-700 dark:text-amber-300"
                />
              </StaggerItem>
              <StaggerItem className="h-full">
                <StatCard
                  icon={FiCheckCircle}
                  value={nbStagiaires}
                  label={t("entrepriseSpace.dashboard.supervisedInterns")}
                  color="bg-success/10 text-green-700 dark:text-emerald-400"
                />
              </StaggerItem>
            </Stagger>

            {/* Attention + Entretiens / Calendrier */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <AttentionCenter items={attentionItems} />
              <UpcomingEntretiensList entretiens={entretiens} />
            </div>

            {/* Graphiques */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.45fr_1fr]">
              <CandidaturesLast30JoursChart candidatures={candidatures} />
              <div className="space-y-6">
                <CandidaturesStatusDonut candidatures={candidatures} />
                <CalendrierWidget entretiens={entretiens} />
              </div>
            </div>

            {/* Listes opérationnelles */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <RecentCandidaturesList candidatures={candidatures} />
              <ProgressionRecrutementsWidget
                offres={offres}
                candidatures={candidatures}
              />
            </div>

            {/* Supervision */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    {t("entrepriseSpace.dashboard.supervisionTitle")}
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t("entrepriseSpace.dashboard.supervisionSubtitle")}
                  </p>
                </div>
                <Link
                  href="/supervision"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  {t("entrepriseSpace.dashboard.viewSupervision")}
                  <FiArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border/60 bg-muted/40 px-3 py-3">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {t("entrepriseSpace.dashboard.supervisedCountLabel")}
                  </p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
                    {nbStagiaires}
                  </p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/40 px-3 py-3">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {t("entrepriseSpace.dashboard.evalToHandle")}
                  </p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
                    {evalsATraiter}
                  </p>
                </div>
                <Link
                  href="/supervision/mes-stagiaires"
                  className="flex items-center justify-center gap-1 rounded-xl border border-dashed border-border bg-background px-3 py-3 text-xs font-semibold text-primary transition hover:border-primary/40 hover:bg-primary/5"
                >
                  {t("sidebar.myInterns")}
                  <FiArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <CandidatsRecommandesWidget />
              <TimelineWidget
                candidatures={candidatures}
                offres={offres}
                entretiens={entretiens}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <RecentActivityFeed />
              <QuickActionsPanel />
            </div>
          </>
        )}
      </div>
    </>
  );
}
