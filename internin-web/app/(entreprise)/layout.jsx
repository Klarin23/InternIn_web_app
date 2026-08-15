"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AppSidebar from "@/components/layout/AppSidebar";
import PullToRefresh from "@/components/layout/PullToRefresh";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useAuthReady } from "@/lib/auth/useAuthReady";
import { useEntrepriseProfile } from "@/lib/queries/useEntrepriseProfile";
import { useEntrepriseNavItems } from "@/lib/navigation/useNavItems";
import { useTranslation } from "@/lib/i18n/useTranslation";

const ROLES_ENTREPRISE = new Set(["entreprise", "membre_entreprise"]);

export default function EntrepriseLayout({ children }) {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const navItems = useEntrepriseNavItems();
  const { data: profile } = useEntrepriseProfile(!!token);
  const { t } = useTranslation();

  const hydrated = useAuthReady();

  useEffect(() => {
    if (!hydrated) return;

    // Ne PAS rediriger uniquement parce que le token access est absent :
    // il est en mémoire seule et peut être rechargé via le cookie refresh.
    // On ne déconnecte que s'il n'y a plus d'utilisateur (session vraiment morte).
    if (!user) {
      router.replace("/connexion");
      return;
    }

    if (!ROLES_ENTREPRISE.has(user.typeUtilisateur)) {
      router.replace("/connexion");
      return;
    }

    if (!user.emailVerifie) {
      router.replace("/verification-email");
      return;
    }

    // Onboarding uniquement pour le compte propriétaire, pas les membres d'équipe
    if (user.typeUtilisateur === "entreprise" && user.statutCompte === "inactif") {
      router.replace("/onboarding/1");
    }
  }, [hydrated, user, router]);

  if (!hydrated) return null;

  if (!user || !ROLES_ENTREPRISE.has(user.typeUtilisateur)) return null;

  const nonVerifiee = profile && profile.statutVerification !== "verifiee";

  return (
    <div className="role-entreprise flex h-screen overflow-hidden bg-muted/30">
      <AppSidebar
        items={navItems}
        roleLabel={t("roles.companySpace")}
        parametresHref="/parametres-entreprise"
        orgCard={
          profile
            ? {
                name: profile.nomEntreprise,
                subtitle:
                  profile.statutVerification === "verifiee"
                    ? t("roles.verified")
                    : t("roles.pending"),
                logoUrl: profile.logoUrl,
              }
            : null
        }
      />
      <PullToRefresh className="h-screen flex-1 overflow-y-auto">
        {nonVerifiee && (
          <div className="sticky top-0 z-20 border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-100">
            <p className="font-medium">
              Entreprise en attente de vérification
            </p>
            <p className="mt-0.5 text-xs opacity-90">
              Certaines fonctionnalités (offres, candidatures, stages) restent
              limitées jusqu&apos;à la validation par l&apos;administration.
            </p>
          </div>
        )}
        {children}
      </PullToRefresh>
    </div>
  );
}
