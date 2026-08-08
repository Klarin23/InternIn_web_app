"use client";

import { useEffect } from "react";
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

  const { user, token } = useAuthStore();
  const navItems = useStagiaireNavItems();
  const { t } = useTranslation();

  useEffect(() => {
    if (!token || !user) {
      router.replace("/connexion");
      return;
    }

    if (user.typeUtilisateur !== "stagiaire") {
      router.replace("/connexion");
    }
  }, [user, token, router]);

  if (!user || user.typeUtilisateur !== "stagiaire") {
    return null;
  }

  const isInactive = user.statutCompte === "inactif";

  const canAccessWhileInactive =
    pathname === "/profil" ||
    pathname.startsWith("/profil/") ||
    pathname === "/parametres" ||
    pathname.startsWith("/parametres/");

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
