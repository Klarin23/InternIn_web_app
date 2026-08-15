"use client";

import {
  FiLoader,
  FiFileText,
  FiShield,
  FiUsers,
  FiAlertTriangle,
} from "react-icons/fi";
import AppHeader from "@/components/layout/AppHeader";
import StatCard from "../dashboard-entreprise/StatCard";
import ActiviteRecenteList from "./ActiviteRecenteList";
import OffresParStatutCard from "./OffresParStatutCard";
import ActionsRequisesCard from "./ActionsRequisesCard";
import { useAdminStats } from "@/lib/queries/useAdminStats";
import { useAdminProfile } from "@/lib/queries/useAdminProfile";

export default function AdminDashboardContent() {
  const { data: stats, isLoading } = useAdminStats();
  const { data: profile } = useAdminProfile();

  return (
    <>
      <AppHeader
        breadcrumb={[{ label: "Tableau de bord" }]}
        avatarLabel={profile?.nom?.slice(0, 2).toUpperCase()}
        refreshKeys={["adminStats", "notifications"]}
      />
      <div className="space-y-6 px-6 py-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Tableau de bord</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Vue d&apos;ensemble de la plateforme
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
                icon={FiFileText}
                value={stats.offresEnAttente}
                label="Offres en attente"
                color="bg-accent/40 text-amber-700"
              />
              <StatCard
                icon={FiShield}
                value={stats.entitesNonVerifiees.total}
                label="Entités non vérifiées"
                sublabel={`${stats.entitesNonVerifiees.universites} universités · ${stats.entitesNonVerifiees.entreprises} entreprises`}
                color="bg-secondary/10 text-secondary"
              />
              <StatCard
                icon={FiUsers}
                value={stats.utilisateursActifs.total.toLocaleString("fr-FR")}
                label="Utilisateurs actifs"
                sublabel={
                  stats.utilisateursActifs.nouveauxCeMois > 0
                    ? `+${stats.utilisateursActifs.nouveauxCeMois} ce mois`
                    : null
                }
                color="bg-success/10 text-green-700"
              />
              <StatCard
                icon={FiAlertTriangle}
                value={stats.signalementsOuverts}
                label="Signalements ouverts"
                color="bg-destructive/10 text-red-700"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
              <ActiviteRecenteList activite={stats.activiteRecente} />
              <div className="space-y-6">
                <OffresParStatutCard repartition={stats.offresParStatut} />
                <ActionsRequisesCard total={stats.actionsRequises} />
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
