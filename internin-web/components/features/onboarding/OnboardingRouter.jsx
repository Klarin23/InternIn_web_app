"use client";
// Choisit le bon jeu d'étapes selon le rôle de l'utilisateur connecté.
// Les étapes stagiaire restent dans steps/ (inchangé) ; les étapes
// entreprise et université seront ajoutées dans steps/entreprise/
// et steps/universite/ au fur et à mesure qu'on les construit.

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";

// Étapes stagiaire (déjà construites)
import Step1InfosPersonnelles from "./steps/Step1InfosPersonnelles";
import Step2StatutAcademique from "./steps/Step2StatutAcademique";
import Step3Formation from "./steps/Step3Formation";
import Step4Cv from "./steps/Step4Cv";
import Step5Liens from "./steps/Step5Liens";
import Step6Competences from "./steps/Step6Competences";
import Step7CentresInteret from "./steps/Step7CentresInteret";
import Step8Objectifs from "./steps/Step8Objectifs";
import Step9Disponibilites from "./steps/Step9Disponibilites";
import Step10Preferences from "./steps/Step10Preferences";
import Step11Recapitulatif from "./steps/Step11Recapitulatif";

// Étapes entreprise 
import EntrepriseStep1Infos from "./steps/entreprise/EntrepriseStep1Infos";
import EntrepriseStep2Presence from "./steps/entreprise/EntrepriseStep2Presence";
import EntrepriseStep3APropos from "./steps/entreprise/EntrepriseStep3APropos";
import EntrepriseStep4Contact from "./steps/entreprise/EntrepriseStep4Contact";
import EntrepriseStep5Recapitulatif from "./steps/entreprise/EntrepriseStep5Recapitulatif";

//Etapes Universite
import UniversiteStep1Infos from "./steps/universite/UniversiteStep1Infos";
import UniversiteStep2Presence from "./steps/universite/UniversiteStep2Presence";
import UniversiteStep3Coordination from "./steps/universite/UniversiteStep3Coordination";
import UniversiteStep4Recapitulatif from "./steps/universite/UniversiteStep4Recapitulatif";

const STEPS_BY_ROLE = {
  stagiaire: {
    1: Step1InfosPersonnelles,
    2: Step2StatutAcademique,
    3: Step3Formation,
    4: Step4Cv,
    5: Step5Liens,
    6: Step6Competences,
    7: Step7CentresInteret,
    8: Step8Objectifs,
    9: Step9Disponibilites,
    10: Step10Preferences,
    11: Step11Recapitulatif,
  },
  entreprise: {
    1: EntrepriseStep1Infos,
    2: EntrepriseStep2Presence,
    3: EntrepriseStep3APropos,
    4: EntrepriseStep4Contact,
    5: EntrepriseStep5Recapitulatif,
    // 2, 3, 4, 5 à venir
  },
  universite: {
    1: UniversiteStep1Infos,
    2: UniversiteStep2Presence,
    3: UniversiteStep3Coordination,
    4: UniversiteStep4Recapitulatif,
    // à venir
  },
};

export default function OnboardingRouter({ etape }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    // Aucun utilisateur connecté -> on ne laisse jamais accéder à l'onboarding
    if (!user) router.replace("/connexion");
  }, [user, router]);

  if (!user) return null;

  const steps = STEPS_BY_ROLE[user.typeUtilisateur] || {};
  const StepComponent = steps[etape];

  if (!StepComponent) {
    return (
      <p className="text-sm text-muted-foreground">
        Cette étape n&apos;est pas encore disponible pour votre profil.
      </p>
    );
  }

  return <StepComponent />;
}
