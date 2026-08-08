"use client";
// Le total d'étapes dépend maintenant du rôle (11 pour stagiaire, 5 pour
// entreprise, 4 pour université) — plus besoin de le lire dans un store
// dédié à l'onboarding, on le déduit du rôle de l'utilisateur connecté.

import { useParams } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import OnboardingStepper from "./OnboardingStepper";

const TOTAL_STEPS_BY_ROLE = { stagiaire: 11, entreprise: 5, universite: 4 };

export default function OnboardingStepperWrapper() {
  const params = useParams();
  const user = useAuthStore((state) => state.user);
  const currentStep = Number(params.etape) || 1;
  const totalSteps = TOTAL_STEPS_BY_ROLE[user?.typeUtilisateur] || 1;

  return (
    <OnboardingStepper currentStep={currentStep} totalSteps={totalSteps} />
  );
}
