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
            user.statutCompte === "inactif"
              ? stagiaireNavItems.filter(
                  (item) =>
                    item.href === "/tableau-de-bord" || item.href === "/profil",
                )
              : stagiaireNavItems
          }
          roleLabel={t("roles.internSpace")}
        />

        <PullToRefresh className="h-screen flex-1 overflow-y-auto">
          {user.statutCompte === "inactif" ? (
            <InactiveAccountGate />
          ) : (
            <StagiaireDashboardContent />
          )}
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
                }
              : null
          }
        />
        <PullToRefresh className="h-screen flex-1 overflow-y-auto">
          <EntrepriseDashboardContent />
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
          <UniversiteDashboardContent />
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

    // Seul le rôle "superviseur" a un espace construit pour l'instant — les
    // autres rôles du menu Équipe (gestionnaire recrutement, lecture seule)
    // n'ont pas encore leur propre tableau de bord.
    if (membreProfile && membreProfile.roleEquipe !== "superviseur") {
      return (
        <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
          {t("roles.noSpaceAvailable")}
        </div>
      );
    }

    return (
      <div className="role-superviseur flex h-screen overflow-hidden bg-muted/30">
        <AppSidebar
          items={superviseurNavItems}
          roleLabel={t("roles.supervisorSpace")}
          userFooter={{
            initials,
            name: membreProfile?.nom || user.email,
            subtitle:
              membreProfile?.nomEntreprise || t("roles.supervisorFallback"),
          }}
        />
        <PullToRefresh className="h-screen flex-1 overflow-y-auto">
          <SuperviseurDashboardContent />
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
