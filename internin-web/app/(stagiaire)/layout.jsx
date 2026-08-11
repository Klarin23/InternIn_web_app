"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";

import AppSidebar from "@/components/layout/AppSidebar";
import PullToRefresh from "@/components/layout/PullToRefresh";
import InactiveAccountGate from "@/components/features/account/InactiveAccountGate";

import { useAuthStore } from "@/lib/store/useAuthStore";
import { useStagiaireNavItems } from "@/lib/navigation/useNavItems";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function StagiaireLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const navItems = useStagiaireNavItems();

  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  // Attendre la rehydration localStorage (internin-auth) avant de juger la session
  // Hydratation Zustand sans setState dans un useEffect (compatible React 19)
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
      return;
    }
    if (user.typeUtilisateur !== "stagiaire") {
      router.replace("/connexion");
    }
  }, [hydrated, user, token, router]);

  if (!hydrated) {
    return null; // ou un petit loader
  }

  if (!user || user.typeUtilisateur !== "stagiaire") {
    return null;
  }

  const isInactive = user.statutCompte !== "actif";

  const canAccessWhileInactive =
    pathname === "/profil" ||
    pathname.startsWith("/profil/") ||
    pathname === "/parametres" ||
    pathname.startsWith("/parametres/") ||
    pathname === "/activation" ||
    pathname.startsWith("/activation/");

  const displayedChildren =
    isInactive && !canAccessWhileInactive ? <InactiveAccountGate /> : children;

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <AppSidebar
        items={
          isInactive
            ? navItems.filter(
                (item) =>
                  item.href === "/tableau-de-bord" || item.href === "/profil",
              )
            : navItems
        }
        roleLabel={t("roles.internSpace")}
      />
      <PullToRefresh className="h-screen flex-1 overflow-y-auto">
        {displayedChildren}
      </PullToRefresh>
    </div>
  );
}
