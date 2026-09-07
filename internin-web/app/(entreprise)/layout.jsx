"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AppSidebar from "@/components/layout/AppSidebar";
import PullToRefresh from "@/components/layout/PullToRefresh";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useAuthReady } from "@/lib/auth/useAuthReady";
import { useEntrepriseProfile } from "@/lib/queries/useEntrepriseProfile";
import {
  useEntrepriseNavItems,
  useSuperviseurNavItems,
} from "@/lib/navigation/useNavItems";
import { useMonProfilEquipe } from "@/lib/queries/useEquipe";
import { useTranslation } from "@/lib/i18n/useTranslation";
import MaintenanceGate from "@/components/features/system/MaintenanceGate";

/**
 * Layout partagé pour les pages de l'espace Entreprise.
 * Accessible :
 *  - au compte propriétaire (typeUtilisateur = "entreprise")
 *  - aux membres d'équipe (typeUtilisateur = "membre_entreprise") qui ont
 *    reçu les permissions correspondantes (ex. offres.gerer → /offres-entreprise).
 * Le menu affiché pour un membre est filtré par ses permissions effectives.
 */
export default function EntrepriseLayout({ children }) {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const entrepriseNavItems = useEntrepriseNavItems();
  const membreNavItems = useSuperviseurNavItems();
  const { data: profile } = useEntrepriseProfile();
  const { data: membreProfile } = useMonProfilEquipe();
  const { t } = useTranslation();

  const hydrated = useAuthReady();
  const isProprietaire = user?.typeUtilisateur === "entreprise";
  const isMembre = user?.typeUtilisateur === "membre_entreprise";

  useEffect(() => {
    if (!hydrated) return;

    if (!token || !user) {
      router.replace("/connexion");
      return;
    }

    if (!isProprietaire && !isMembre) {
      router.replace("/connexion");
      return;
    }

    // Contrôles d'onboarding uniquement pour le propriétaire
    if (isProprietaire) {
      if (!user.emailVerifie) {
        router.replace("/verification-email");
      } else if (user.statutCompte === "inactif") {
        router.replace("/onboarding/1");
      }
    }
  }, [hydrated, user, token, router, isProprietaire, isMembre]);

  if (!hydrated) return null;
  if (!user || (!isProprietaire && !isMembre)) return null;

  const nonVerifiee =
    isProprietaire && profile && profile.statutVerification !== "verifiee";

  // Membre → menu filtré par permissions ; propriétaire → menu complet
  const navItems = isMembre ? membreNavItems : entrepriseNavItems;

  const initials = membreProfile?.nom
    ? membreProfile.nom
        .split(" ")
        .map((p) => p.charAt(0))
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : user.email?.slice(0, 2).toUpperCase();

  return (
    <div className="role-entreprise flex h-screen overflow-hidden bg-muted/30">
      <AppSidebar
        items={navItems}
        roleLabel={
          isMembre ? t("roles.supervisorSpace") : t("roles.companySpace")
        }
        parametresHref={
          isProprietaire ? "/parametres-entreprise" : undefined
        }
        orgCard={
          isProprietaire && profile
            ? {
                name: profile.nomEntreprise,
                subtitle:
                  profile.statutVerification === "verifiee"
                    ? t("roles.verified")
                    : t("roles.pending"),
                logoUrl: profile.logoUrl,
              }
            : isMembre
              ? {
                  name:
                    membreProfile?.nomEntreprise ||
                    t("roles.supervisorFallback") ||
                    "Entreprise",
                  subtitle:
                    membreProfile?.roleEquipe || t("roles.supervisorSpace"),
                }
              : null
        }
        userFooter={
          isMembre
            ? {
                initials,
                name: membreProfile?.nom || user.email,
                subtitle:
                  membreProfile?.nomEntreprise ||
                  t("roles.supervisorFallback") ||
                  "Entreprise",
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
              Un administrateur doit valider votre compte avant que vous
              puissiez publier des offres, gérer des candidatures, planifier
              des entretiens ou suivre des stages. Vous pouvez compléter votre
              profil en attendant.
            </p>
          </div>
        )}
        <MaintenanceGate>{children}</MaintenanceGate>
      </PullToRefresh>
    </div>
  );
}
