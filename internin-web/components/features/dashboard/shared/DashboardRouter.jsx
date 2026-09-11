"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AppSidebar from "@/components/layout/AppSidebar";
import PullToRefresh from "@/components/layout/PullToRefresh";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useEntrepriseProfile } from "@/lib/queries/useEntrepriseProfile";
import { useAdminProfile } from "@/lib/queries/useAdminProfile";
import {
  useStagiaireNavItems,
  useEntrepriseNavItems,
  useAdminNavItems,
  useSuperviseurNavItems,
  useRoleAdminLabels,
} from "@/lib/navigation/useNavItems";
import StagiaireDashboardContent from "../StagiaireDashboardContent";
import EntrepriseDashboardContent from "../../dashboard-entreprise/EntrepriseDashboardContent";
import AdminDashboardContent from "../../dashboard-admin/AdminDashboardContent";
import SuperviseurDashboardContent from "../../dashboard-superviseur/SuperviseurDashboardContent";
import { useUniversiteProfile } from "@/lib/queries/useUniversiteProfile";
import { useUniversiteNavItems } from "@/lib/navigation/useNavItems"; // (à fusionner avec l'import existant de useNavItems)
import UniversiteDashboardContent from "../../dashboard-universite/UniversiteDashboardContent";
import { useMonProfilEquipe } from "@/lib/queries/useEquipe";
import { useTranslation } from "@/lib/i18n/useTranslation";
import InactiveAccountGate from "@/components/features/account/InactiveAccountGate";
import AdminMaintenanceToast from "@/components/features/system/AdminMaintenanceToast";
import MaintenanceGate from "@/components/features/system/MaintenanceGate";

export default function DashboardRouter() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const { t } = useTranslation();
  const stagiaireNavItems = useStagiaireNavItems();
  const entrepriseNavItems = useEntrepriseNavItems();
  const { data: entrepriseProfile } = useEntrepriseProfile();
  const adminNavItems = useAdminNavItems();
  const { data: adminProfile } = useAdminProfile();
  const roleAdminLabels = useRoleAdminLabels();
  const universiteNavItems = useUniversiteNavItems();
  const { data: universiteProfile } = useUniversiteProfile();
  const superviseurNavItems = useSuperviseurNavItems();
  const { data: membreProfile } = useMonProfilEquipe();

  useEffect(() => {
    if (!token || !user) {
      router.replace("/connexion");
    } 
  }, [user, token, router]);

  if (!user) return null;

  if (user.typeUtilisateur === "stagiaire") {
    return (
      <div className="flex h-screen overflow-hidden bg-muted/30">
        <AppSidebar
          items={
            user.statutCompte !== "actif"
              ? stagiaireNavItems.filter(
                  (item) =>
                    item.href === "/tableau-de-bord" || item.href === "/profil",
                )
              : stagiaireNavItems
          }
          roleLabel={t("roles.internSpace")}
        />

        <PullToRefresh className="h-screen flex-1 overflow-y-auto">
          <MaintenanceGate>
            {user.statutCompte !== "actif" ? (
              <InactiveAccountGate />
            ) : (
              <StagiaireDashboardContent />
            )}
          </MaintenanceGate>
        </PullToRefresh>
      </div>
    );
  }

  if (user.typeUtilisateur === "entreprise") {
    return (
      <div className="role-entreprise flex h-screen overflow-hidden bg-muted/30">
        <AppSidebar
          items={entrepriseNavItems}
          roleLabel={t("roles.companySpace")}
          parametresHref="/parametres-entreprise"
          orgCard={
            entrepriseProfile
              ? {
                  name: entrepriseProfile.nomEntreprise,
                  subtitle:
                    entrepriseProfile.statutVerification === "verifiee"
                      ? t("roles.verified")
                      : t("roles.pending"),
                  logoUrl: entrepriseProfile.logoUrl,
                }
              : null
          }
        />
        <PullToRefresh className="h-screen flex-1 overflow-y-auto">
          <MaintenanceGate>
            <EntrepriseDashboardContent />
          </MaintenanceGate>
        </PullToRefresh>
      </div>
    );
  }

  if (user.typeUtilisateur === "universite") {
    return (
      <div className="role-universite flex h-screen overflow-hidden bg-muted/30">
        <AppSidebar
          items={universiteNavItems}
          roleLabel={t("roles.universitySpace")}
          parametresHref="/parametres-universite"
          orgCard={
            universiteProfile
              ? {
                  name: universiteProfile.nomUniversite,
                  subtitle:
                    universiteProfile.statutVerification === "verifiee"
                      ? t("roles.verified")
                      : t("roles.pending"),
                }
              : null
          }
          userFooter={{
            initials: universiteProfile?.nomCoordinateurStage
              ? universiteProfile.nomCoordinateurStage
                  .split(" ")
                  .map((p) => p.charAt(0))
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()
              : user.email?.slice(0, 2).toUpperCase(),
            name: universiteProfile?.nomCoordinateurStage || user.email,
            subtitle: t("roles.stageManager"),
          }}
        />
        <PullToRefresh className="h-screen flex-1 overflow-y-auto">
          <MaintenanceGate>
            <UniversiteDashboardContent />
          </MaintenanceGate>
        </PullToRefresh>
      </div>
    );
  }

  if (user.typeUtilisateur === "administrateur") {
    const initials = adminProfile?.nom
      ? adminProfile.nom
          .split(" ")
          .map((p) => p.charAt(0))
          .slice(0, 2)
          .join("")
          .toUpperCase()
      : user.email?.slice(0, 2).toUpperCase();

    return (
      <div className="role-admin flex h-screen overflow-hidden bg-muted/30">
        <AdminMaintenanceToast />
        <AppSidebar
          items={adminNavItems}
          roleLabel={t("roles.adminConsole")}
          userFooter={{
            initials,
            name: adminProfile?.nom || user.email,
            subtitle: adminProfile?.roleAdmin
              ? roleAdminLabels[adminProfile.roleAdmin] ||
                adminProfile.roleAdmin
              : t("roles.administrator"),
          }}
        />
        <PullToRefresh className="h-screen flex-1 overflow-y-auto">
          <AdminDashboardContent />
        </PullToRefresh>
      </div>
    );
  }

  if (user.typeUtilisateur === "membre_entreprise") {
    const initials = membreProfile?.nom
      ? membreProfile.nom
          .split(" ")
          .map((p) => p.charAt(0))
          .slice(0, 2)
          .join("")
          .toUpperCase()
      : user.email?.slice(0, 2).toUpperCase();

    const nomEntreprise =
      membreProfile?.nomEntreprise ||
      t("roles.supervisorFallback") ||
      "Entreprise";

    // Même identité visuelle que l'espace entreprise (compte dérivé)
    // + orgCard pour que le nom d'entreprise reste visible sur le dashboard
    return (
      <div className="role-entreprise flex h-screen overflow-hidden bg-muted/30">
        <AppSidebar
          items={superviseurNavItems}
          roleLabel={t("roles.supervisorSpace")}
          orgCard={{
            name: nomEntreprise,
            subtitle: membreProfile?.roleEquipe || t("roles.supervisorSpace"),
          }}
          userFooter={{
            initials,
            name: membreProfile?.nom || user.email,
            subtitle: nomEntreprise,
          }}
        />
        <PullToRefresh className="h-screen flex-1 overflow-y-auto">
          <MaintenanceGate>
            <SuperviseurDashboardContent />
          </MaintenanceGate>
        </PullToRefresh>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
      {t("roles.dashboardUnavailable")}
    </div>
  );
}
