"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AppSidebar from "@/components/layout/AppSidebar";
import PullToRefresh from "@/components/layout/PullToRefresh";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useEntrepriseProfile } from "@/lib/queries/useEntrepriseProfile";
import { useEntrepriseNavItems } from "@/lib/navigation/useNavItems";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function EntrepriseLayout({ children }) {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const navItems = useEntrepriseNavItems();
  const { data: profile } = useEntrepriseProfile();
  const { t } = useTranslation();

    useEffect(() => {
      if (!token || !user) {
        router.replace("/connexion");
      } else if (user.typeUtilisateur !== "entreprise") {
        router.replace("/connexion");
      } else if (!user.emailVerifie) {
        router.replace("/verification-email");
      } else if (user.statutCompte === "inactif") {
        router.replace("/onboarding/1");
      }
    }, [user, token, router]);

  if (!user || user.typeUtilisateur !== "entreprise") return null;

   if (!user || user.typeUtilisateur !== "entreprise") return null;

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
               Un administrateur doit valider votre compte avant que vous
               puissiez publier des offres, gérer des candidatures, planifier
               des entretiens ou suivre des stages. Vous pouvez compléter votre
               profil en attendant.
             </p>
           </div>
         )}
         {children}
       </PullToRefresh>
     </div>
   );
}
