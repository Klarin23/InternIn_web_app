"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AppSidebar from "@/components/layout/AppSidebar";
import PullToRefresh from "@/components/layout/PullToRefresh";
import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  useAdminNavItems,
  useRoleAdminLabels,
} from "@/lib/navigation/useNavItems";
import { useAdminProfile } from "@/lib/queries/useAdminProfile";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const navItems = useAdminNavItems();
  const { data: profile } = useAdminProfile();
  const { t } = useTranslation();
  const roleAdminLabels = useRoleAdminLabels();

  useEffect(() => {
    if (!token || !user || user.typeUtilisateur !== "administrateur") {
      router.replace("/connexion");
    }
  }, [user, token, router]);

  if (!user || user.typeUtilisateur !== "administrateur") return null;

  const initials = profile?.nom
    ? profile.nom
        .split(" ")
        .map((p) => p.charAt(0))
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : user.email?.slice(0, 2).toUpperCase();

  return (
    <div className="role-admin flex h-screen overflow-hidden bg-muted/30">
      <AppSidebar
        items={navItems}
        roleLabel={t("roles.adminConsole")}
        userFooter={{
          initials,
          name: profile?.nom || user.email,
          subtitle: profile?.roleAdmin
            ? roleAdminLabels[profile.roleAdmin] || profile.roleAdmin
            : t("roles.administrator"),
        }}
      />
      <PullToRefresh className="h-screen flex-1 overflow-y-auto">
        {children}
      </PullToRefresh>
    </div>
  );
}
