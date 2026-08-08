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

export default function EntrepriseDashboardContent() {
  const { data: profile, isLoading: profileLoading } = useEntrepriseProfile();
  const { data: offres, isLoading: offresLoading } = useMesOffres();
  const { data: candidatures, isLoading: candidaturesLoading } =
    useCandidaturesEntreprise();
  const { data: entretiens, isLoading: entretiensLoading } =
    useEntretiensEntreprise();

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
      />
      <div className="space-y-6 px-6 py-6">
        {isLoading && <DashboardSkeleton />}

        {profile && (
          <>
            <VerificationBanner statut={profile.statutVerification} />

            <WelcomeBanner nomEntreprise={profile.nomEntreprise} />

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
