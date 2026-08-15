"use client";

import {
  FiUsers,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
} from "react-icons/fi";
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
import Link from "next/link";
import { FiAlertTriangle, FiArrowRight } from "react-icons/fi";
import {
  useMesStagiaires,
  useEvaluationsSuperviseur,
} from "@/lib/queries/useSuperviseur";

export default function EntrepriseDashboardContent() {
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

  const offresActives = (offres || []).filter(
    (o) => o.statut === "publie",
  ).length;
  const entretiensPlanifies = (entretiens || []).filter(
    (e) => e.statut === "planifie",
  ).length;
  const candidaturesAcceptees = (candidatures || []).filter(
    (c) => c.statut === "acceptee",
  ).length;

  return (
    <>
      <AppHeader
        breadcrumb={[
          { label: profile?.nomEntreprise || "Entreprise" },
          { label: "Tableau de bord" },
        ]}
        avatarLabel={profile?.nomEntreprise?.slice(0, 2).toUpperCase()}
        refreshKeys={["mesOffres", "candidaturesEntreprise", "entretiensEntreprise", "notifications"]}
      />
      <div className="space-y-6 px-6 py-6">
        {isLoading && <DashboardSkeleton />}

        {profile && (
          <>
            <VerificationBanner statut={profile.statutVerification} />

            <WelcomeBanner nomEntreprise={profile.nomEntreprise} />

            {/* Bloc Supervision — intégration des outils d'encadrement */}
            <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-foreground">Supervision</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Encadrement de vos stagiaires accueillis
                  </p>
                </div>
                <Link
                  href="/supervision"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  Voir la supervision <FiArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-muted/50 px-3 py-2.5">
                  <p className="text-[10px] font-medium uppercase text-muted-foreground">Stagiaires</p>
                  <p className="text-lg font-bold tabular-nums">{stagiairesSupervision?.length ?? 0}</p>
                </div>
                <div className="rounded-xl bg-muted/50 px-3 py-2.5">
                  <p className="text-[10px] font-medium uppercase text-muted-foreground">Éval. à traiter</p>
                  <p className="text-lg font-bold tabular-nums text-amber-600">
                    {evaluationsSupervision?.filter((e) => e.statutAffichage === "a_effectuer" || e.statutAffichage === "en_retard").length ?? 0}
                  </p>
                </div>
                <Link
                  href="/supervision/mes-stagiaires"
                  className="col-span-2 flex items-center justify-center gap-2 rounded-xl border border-dashed border-border px-3 py-2.5 text-xs font-semibold text-muted-foreground transition hover:border-primary/40 hover:text-primary sm:col-span-1"
                >
                  Mes stagiaires <FiArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StaggerItem className="h-full">
                <StatCard
                  icon={FiBriefcase}
                  value={offresActives}
                  label="Offres publiées"
                  sublabel={`sur ${offres?.length ?? 0} au total`}
                  color="bg-secondary-foreground/10 text-secondary-foreground"
                />
              </StaggerItem>
              <StaggerItem className="h-full">
                <StatCard
                  icon={FiUsers}
                  value={candidatures?.length ?? 0}
                  label="Candidatures reçues"
                  color="bg-primary/10 text-primary"
                  highlight
                />
              </StaggerItem>
              <StaggerItem className="h-full">
                <StatCard
                  icon={FiCalendar}
                  value={entretiensPlanifies}
                  label="Entretiens programmés"
                  color="bg-accent/40 text-amber-700"
                />
              </StaggerItem>
              <StaggerItem className="h-full">
                <StatCard
                  icon={FiCheckCircle}
                  value={candidaturesAcceptees}
                  label="Stagiaires en cours"
                  color="bg-success/10 text-green-700"
                />
              </StaggerItem>
            </Stagger>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
              <CandidaturesLast30JoursChart candidatures={candidatures} />
              <div className="space-y-6">
                <CandidaturesStatusDonut candidatures={candidatures} />
                <CalendrierWidget entretiens={entretiens} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <RecentCandidaturesList candidatures={candidatures} />
              <UpcomingEntretiensList entretiens={entretiens} />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <TimelineWidget
                candidatures={candidatures}
                offres={offres}
                entretiens={entretiens}
              />
              <ProgressionRecrutementsWidget
                offres={offres}
                candidatures={candidatures}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <RecentActivityFeed />
              <QuickActionsPanel />
            </div>

            <CandidatsRecommandesWidget />
          </>
        )}
      </div>
    </>
  );
}
