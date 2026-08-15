"use client";

import { useSupervisionContext } from "@/lib/supervision/SupervisionContext";

import { use } from "react";
import { FiLoader } from "react-icons/fi";
import AppHeader from "@/components/layout/AppHeader";
import DetailStagiaireTabs from "@/components/features/detail-stagiaire/DetailStagiaireTabs";
import ProgressionBar from "@/components/features/detail-stagiaire/ProgressionBar";
import ObjectifsPanel from "@/components/features/detail-stagiaire/ObjectifsPanel";
import TachesPanel from "@/components/features/detail-stagiaire/TachesPanel";
import CompetencesAcquisesPanel from "@/components/features/detail-stagiaire/CompetencesAcquisesPanel";
import ObservationsPanel from "@/components/features/detail-stagiaire/ObservationsPanel";
import {
  useDetailStagiaire,
  useProgression,
} from "@/lib/queries/useSuperviseur";

export default function ProgressionStagiairePage({ params }) {
  const { basePath } = useSupervisionContext();
  const { idStage } = use(params);
  const { data: detail } = useDetailStagiaire(idStage);
  const { data: progression, isLoading, error } = useProgression(idStage);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
        <FiLoader className="h-5 w-5 animate-spin" />
        Chargement...
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-16 text-center text-sm text-destructive">
        {error.message}
      </div>
    );
  }

  return (
    <>
      <AppHeader
        breadcrumb={[
          { label: "Mes stagiaires", href: basePath },
          {
            label: detail
              ? `${detail.stagiaire.prenom} ${detail.stagiaire.nom}`
              : "...",
          },
          { label: "Suivi de progression" },
        ]}
      />
      <div className="px-6 py-6">
        <DetailStagiaireTabs idStage={idStage} />

        <div className="space-y-5">
          <ProgressionBar
            idStage={idStage}
            progressionManuelle={progression.progressionManuelle}
            progressionCalculee={progression.progressionCalculee}
          />

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <ObjectifsPanel
              idStage={idStage}
              objectifs={progression.objectifs}
            />
            <TachesPanel idStage={idStage} taches={progression.taches} />
          </div>

          <CompetencesAcquisesPanel
            idStage={idStage}
            competencesAcquises={progression.competencesAcquises}
          />

          <ObservationsPanel
            idStage={idStage}
            observations={progression.observations}
          />
        </div>
      </div>
    </>
  );
}
