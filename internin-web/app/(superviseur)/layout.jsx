"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AppSidebar from "@/components/layout/AppSidebar";
import PullToRefresh from "@/components/layout/PullToRefresh";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useAuthReady } from "@/lib/auth/useAuthReady";
import { useMonProfilEquipe } from "@/lib/queries/useEquipe";
import { useMembrePermissions } from "@/lib/queries/useMembrePermissions";
import { canAccessSupervision } from "@/lib/navigation/memberPermissions";
import { useSuperviseurNavItems } from "@/lib/navigation/useNavItems";
import { useTranslation } from "@/lib/i18n/useTranslation";
import MaintenanceGate from "@/components/features/system/MaintenanceGate";

export default function SuperviseurLayout({ children }) {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const navItems = useSuperviseurNavItems();
  const { data: profil } = useMonProfilEquipe();
  const membrePerms = useMembrePermissions();
  const { t } = useTranslation();
  const hydrated = useAuthReady();

  // Toutes les pages de ce groupe appellent /superviseur/*, qui exige la
  // permission "stagiaires.suivre". Sans elle (ex. gestionnaire de
  // recrutement), on renvoie vers le tableau de bord plutôt que d'afficher
  // une erreur de chargement trompeuse. Si les permissions sont inconnues
  // (profil injoignable), l'API reste l'arbitre final.
  const permissionsConnues = !membrePerms.isPending && !membrePerms.isUnresolved;
  const accesRefuse =
    permissionsConnues && !canAccessSupervision(membrePerms.permissions);

  useEffect(() => {
    if (!hydrated) return;
    if (!token || !user) {
      router.replace("/connexion");
    } else if (user.typeUtilisateur !== "membre_entreprise") {
      router.replace("/connexion");
    }
  }, [hydrated, user, token, router]);

  useEffect(() => {
    if (!hydrated || !user || user.typeUtilisateur !== "membre_entreprise") return;
    if (accesRefuse) router.replace("/tableau-de-bord");
  }, [hydrated, user, accesRefuse, router]);

  if (!hydrated) return null;
  if (!user || user.typeUtilisateur !== "membre_entreprise") return null;

  const initials = profil?.nom
    ? profil.nom
        .split(" ")
        .map((p) => p.charAt(0))
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : user.email?.slice(0, 2).toUpperCase();

  const nomEntreprise =
    profil?.nomEntreprise || t("roles.supervisorFallback") || "Entreprise";

  return (
    <div className="role-entreprise flex h-screen overflow-hidden bg-muted/30">
      <AppSidebar
        items={navItems}
        roleLabel={t("roles.supervisorSpace")}
        orgCard={{
          name: nomEntreprise,
          subtitle: profil?.roleEquipe || t("roles.supervisorSpace"),
        }}
        userFooter={{
          initials,
          name: profil?.nom || user.email,
          subtitle: nomEntreprise,
        }}
      />
      <PullToRefresh className="h-screen flex-1 overflow-y-auto">
        <MaintenanceGate>
          {membrePerms.isPending || accesRefuse ? null : children}
        </MaintenanceGate>
      </PullToRefresh>
    </div>
  );
}
