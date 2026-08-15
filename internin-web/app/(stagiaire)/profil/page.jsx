"use client";

import AppHeader from "@/components/layout/AppHeader";
import { useStagiaireProfile } from "@/lib/queries/useStagiaireProfile";
import ProfilHeader from "@/components/features/profil/ProfilHeader";
import ProfilSkeleton from "@/components/features/profil/ProfilSkeleton";
import InfosPersonnellesSection from "@/components/features/profil/InfosPersonnellesSection";
import ParcoursAcademiqueSection from "@/components/features/profil/ParcoursAcademiqueSection";
import ProfilProfessionnelSection from "@/components/features/profil/ProfilProfessionnelSection";
import CompetencesSection from "@/components/features/profil/CompetencesSection";
import CvSection from "@/components/features/profil/CvSection";
import LiensProfessionnelsSection from "@/components/features/profil/LiensProfessionnelsSection";
import CentresInteretSection from "@/components/features/profil/CentresInteretSection";
import PreferencesRechercheSection from "@/components/features/profil/PreferencesRechercheSection";

export default function ProfilPage() {
  const { data: profil, isLoading } = useStagiaireProfile();

  return (
    <>
      <AppHeader
        title="Mon profil"
        subtitle="Complétez votre profil pour être remarqué des recruteurs"
      />
      <div className="space-y-6 px-4 py-6 sm:px-6">
        {isLoading && <ProfilSkeleton />}

        {profil && (
          <>
            <ProfilHeader profil={profil} />
            <ProfilProfessionnelSection profil={profil} />
            <InfosPersonnellesSection profil={profil} />
            <ParcoursAcademiqueSection profil={profil} />
            <CompetencesSection profil={profil} />
            <CvSection profil={profil} />
            <LiensProfessionnelsSection profil={profil} />
            <CentresInteretSection profil={profil} />
            <PreferencesRechercheSection profil={profil} />
          </>
        )}
      </div>
    </>
  );
}
