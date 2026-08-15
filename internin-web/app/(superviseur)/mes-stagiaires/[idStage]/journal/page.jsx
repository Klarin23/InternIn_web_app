"use client";

import { useSupervisionContext } from "@/lib/supervision/SupervisionContext";

import { use } from "react";
import { FiLoader } from "react-icons/fi";
import AppHeader from "@/components/layout/AppHeader";
import DetailStagiaireTabs from "@/components/features/detail-stagiaire/DetailStagiaireTabs";
import JournalModerationPanel from "@/components/features/detail-stagiaire/JournalModerationPanel";
import {
  useDetailStagiaire,
  useJournalSuperviseur,
} from "@/lib/queries/useSuperviseur";

export default function JournalStagiairePage({ params }) {
  const { basePath } = useSupervisionContext();
  const { idStage } = use(params);
  const { data: detail } = useDetailStagiaire(idStage);
  const { data: entrees, isLoading, error } = useJournalSuperviseur(idStage);

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
          { label: "Journal de stage" },
        ]}
      />
      <div className="px-6 py-6">
        <DetailStagiaireTabs idStage={idStage} />
        <JournalModerationPanel idStage={idStage} entrees={entrees} />
      </div>
    </>
  );
}
