"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import AppSidebar from "@/components/layout/AppSidebar";
import PullToRefresh from "@/components/layout/PullToRefresh";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useUniversiteNavItems } from "@/lib/navigation/useNavItems";
import { useUniversiteProfile } from "@/lib/queries/useUniversiteProfile";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function UniversiteLayout({ children }) {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const navItems = useUniversiteNavItems();
  const { data: profile } = useUniversiteProfile();
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

    if (!token || !user || user.typeUtilisateur !== "universite") {
      router.replace("/connexion");
    }
  }, [hydrated, user, token, router]);

  if (!hydrated) return null;

  if (!user || user.typeUtilisateur !== "universite") return null;

  const initials = profile?.nomCoordinateurStage
    ? profile.nomCoordinateurStage
        .split(" ")
        .map((p) => p.charAt(0))
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : user.email?.slice(0, 2).toUpperCase();

  return (
    <div className="role-universite flex h-screen overflow-hidden bg-muted/30">
      <AppSidebar
        items={navItems}
        roleLabel={t("roles.universitySpace")}
        parametresHref="/parametres-universite"
        orgCard={
          profile
            ? {
                name: profile.nomUniversite,
                subtitle:
                  profile.statutVerification === "verifiee"
                    ? t("roles.verified")
                    : t("roles.pending"),
              }
            : null
        }
        userFooter={{
          initials,
          name: profile?.nomCoordinateurStage || user.email,
          subtitle: t("roles.stageManager"),
        }}
      />
      <PullToRefresh className="h-screen flex-1 overflow-y-auto">
        {children}
      </PullToRefresh>
    </div>
  );
}
