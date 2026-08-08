// Page fine : délègue tout le choix du composant d'étape à OnboardingRouter
// (Client Component, car il doit lire le rôle de l'utilisateur connecté
// depuis le store d'authentification, qui n'existe que côté navigateur).

import OnboardingRouter from "@/components/features/onboarding/OnboardingRouter";

export const metadata = {
  title: "InternIn — Complétez votre profil",
};

export default async function OnboardingStepPage({ params }) {
  const { etape } = await params;
  return <OnboardingRouter etape={etape} />;
}
