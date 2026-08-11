"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import AppSidebar from "@/components/layout/AppSidebar";
import PullToRefresh from "@/components/layout/PullToRefresh";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useMonProfilEquipe } from "@/lib/queries/useEquipe";
import { useSuperviseurNavItems } from "@/lib/navigation/useNavItems";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function SuperviseurLayout({ children }) {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const navItems = useSuperviseurNavItems();
  const { data: profil } = useMonProfilEquipe();
  const { t } = useTranslation();

  const hydrated = useSyncExternalStore(
    (onStoreChange) => {
      const unsub = useAuthStore.persist.onFinishHydration(onStoreChange);
      return unsub;
    },
    () => useAuthStore.persist.hasHydrated(),
    () => false,
  );

  useEffect(() => {
    if (!hydrated) return;

    if (!token || !user) {
      router.replace("/connexion");
    } else if (user.typeUtilisateur !== "membre_entreprise") {
      router.replace("/connexion");
    }
  }, [hydrated, user, token, router]);

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

  return (
    <div className="role-superviseur flex h-screen overflow-hidden bg-muted/30">
      <AppSidebar
        items={navItems}
        roleLabel={t("roles.supervisorSpace")}
        userFooter={{
          initials,
          name: profil?.nom || user.email,
          subtitle: profil?.nomEntreprise || t("roles.supervisorFallback"),
        }}
      />
      <PullToRefresh className="h-screen flex-1 overflow-y-auto">
        {children}
      </PullToRefresh>
    </div>
  );
}
