"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AppSidebar from "@/components/layout/AppSidebar";
import PullToRefresh from "@/components/layout/PullToRefresh";
import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  useStagiaireNavItems,
  useEntrepriseNavItems,
  useAdminNavItems,
  useSuperviseurNavItems,
  useUniversiteNavItems,
  useRoleAdminLabels,
} from "@/lib/navigation/useNavItems";
import { useEntrepriseProfile } from "@/lib/queries/useEntrepriseProfile";
import { useAdminProfile } from "@/lib/queries/useAdminProfile";
import { useUniversiteProfile } from "@/lib/queries/useUniversiteProfile";
import { useMonProfilEquipe } from "@/lib/queries/useEquipe";
import { useTranslation } from "@/lib/i18n/useTranslation";

/**
 * Shell sidebar + contenu pour pages partagées hors Route Groups
 * (ex. /notifications — même idée que /tableau-de-bord).
 */
export default function RoleAppShell({ children }) {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, token } = useAuthStore();

  const stagiaireNavItems = useStagiaireNavItems();
  const entrepriseNavItems = useEntrepriseNavItems();
  const adminNavItems = useAdminNavItems();
  const superviseurNavItems = useSuperviseurNavItems();
  const universiteNavItems = useUniversiteNavItems();
  const roleAdminLabels = useRoleAdminLabels();

  const { data: entrepriseProfile } = useEntrepriseProfile();
  const { data: adminProfile } = useAdminProfile();
  const { data: universiteProfile } = useUniversiteProfile();
  const { data: membreProfile } = useMonProfilEquipe();

  useEffect(() => {
    // Ne déconnecter que s'il n'y a plus d'utilisateur (session morte).
    // L'absence temporaire de token access ne doit pas forcer la reconnexion.
    if (!user) router.replace("/connexion");
  }, [user, router]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Chargement…
      </div>
    );
  }

  let sidebar = null;

  if (user.typeUtilisateur === "stagiaire") {
    sidebar = (
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
    );
  } else if (user.typeUtilisateur === "entreprise") {
    sidebar = (
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
    );
  } else if (user.typeUtilisateur === "universite") {
    sidebar = (
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
      />
    );
  } else if (user.typeUtilisateur === "administrateur") {
    const initials = adminProfile?.nom
      ? adminProfile.nom
          .split(" ")
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : (user.email || "?").slice(0, 2).toUpperCase();
    sidebar = (
      <AppSidebar
        items={adminNavItems}
        roleLabel={t("roles.adminConsole")}
        userFooter={{
          initials,
          name: adminProfile?.nom || user.email,
          subtitle: adminProfile?.roleAdmin
            ? roleAdminLabels[adminProfile.roleAdmin] || adminProfile.roleAdmin
            : t("roles.administrator"),
        }}
      />
    );
  } else if (user.typeUtilisateur === "membre_entreprise") {
    const initials = membreProfile?.nom
      ? membreProfile.nom
          .split(" ")
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : (user.email || "?").slice(0, 2).toUpperCase();
    sidebar = (
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
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      {sidebar}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <PullToRefresh>
          <main className="flex-1 overflow-y-auto">{children}</main>
        </PullToRefresh>
      </div>
    </div>
  );
}
