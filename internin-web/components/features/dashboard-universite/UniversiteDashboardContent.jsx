"use client";

import {
  FiLoader,
  FiAward,
  FiBriefcase,
  FiFileText,
  FiClock,
} from "react-icons/fi";
import AppHeader from "@/components/layout/AppHeader";
import StatCard from "../dashboard-entreprise/StatCard";
import RepartitionStagesCard from "./RepartitionStagesCard";
import EvolutionConventionsCard from "./EvolutionConventionsCard";
import AlertesConventionsCard from "./AlertesConventionsCard";
import { useUniversiteStats } from "@/lib/queries/useUniversiteStats";
import { useUniversiteProfile } from "@/lib/queries/useUniversiteProfile";

export default function UniversiteDashboardContent() {
  const { data: stats, isLoading } = useUniversiteStats();
  const { data: profile } = useUniversiteProfile();

  return (
    <>
      <AppHeader
        breadcrumb={[{ label: "Tableau de bord" }]}
        avatarLabel={profile?.nomCoordinateurStage?.slice(0, 2).toUpperCase()}
        refreshKeys={["universiteStats", "notifications"]}
      />
      <div className="space-y-6 px-6 py-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Tableau de bord</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Vue générale
            {profile?.nomUniversite ? ` — ${profile.nomUniversite}` : ""}
          </p>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <FiLoader className="h-5 w-5 animate-spin" />
            Chargement...
          </div>
        )}

        {stats && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={FiAward}
                value={stats.etudiantsInscrits}
                label="Étudiants inscrits"
                color="bg-primary/10 text-primary"
              />
              <StatCard
                icon={FiBriefcase}
                value={stats.entreprisesPartenaires}
                label="Entreprises partenaires"
                color="bg-success/10 text-success"
              />
              <StatCard
                icon={FiFileText}
                value={stats.conventionsActives}
                label="Conventions actives"
                color="bg-secondary/10 text-secondary"
              />
              <StatCard
                icon={FiClock}
                value={stats.conventionsEnAttente}
                label="En attente de validation"
                color="bg-warning/10 text-amber-700"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
              <EvolutionConventionsCard depotsParMois={stats.depotsParMois} />
              <RepartitionStagesCard repartition={stats.repartitionStatuts} />
            </div>

            <AlertesConventionsCard alertes={stats.alertes} />
          </>
        )}
      </div>
    </>
  );
}
