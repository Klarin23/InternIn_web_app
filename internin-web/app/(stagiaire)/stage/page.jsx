"use client";

import { FiLoader, FiBriefcase } from "react-icons/fi";
import AppHeader from "@/components/layout/AppHeader";
import EvaluationTimeline from "@/components/features/stage/EvaluationTimeline";
import CoachIACard from "@/components/features/stage/CoachIACard";
import { useMonStage } from "@/lib/queries/useStages";
import { useEvaluations, useCoaching } from "@/lib/queries/useEvaluations";
import CertificatCard from "@/components/features/stage/CertificatCard";
import RecommandationCard from "@/components/features/stage/RecommandationCard";
import { useCertificat } from "@/lib/queries/useStages";
import { useRecommandation } from "@/lib/queries/useRecommandations";
import JournalStageSection from "@/components/features/stage/JournalStageSection";

export default function StagePage() {
  const { data: stage, isLoading: stageLoading } = useMonStage();
  const { data: evaluations } = useEvaluations(stage?.idStage);
  const { data: coaching } = useCoaching(stage?.idStage);
  const { data: certificat } = useCertificat(stage?.idStage);
  const { data: recommandation } = useRecommandation(stage?.idStage);

  return (
    <>
      <AppHeader title="Mon stage" />
      <div className="space-y-6 px-6 py-6">
        {stageLoading && (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <FiLoader className="h-5 w-5 animate-spin" />
            Chargement...
          </div>
        )}

        {!stageLoading && !stage && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <FiBriefcase className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              Vous n&apos;avez pas de stage actif pour l&apos;instant
            </p>
          </div>
        )}

        {stage && (
          <>
            <div className="rounded-md border border-border bg-card p-5">
              <h1 className="mb-1 text-xl font-bold text-foreground">
                {stage.nomEntreprise}
              </h1>
              <p className="text-sm text-muted-foreground">
                Du {stage.dateDebut} au {stage.dateFinPrevue}
              </p>
              {stage.objectifsApprentissage && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {stage.objectifsApprentissage}
                </p>
              )}
            </div>

            <div>
              <h5 className="mb-3 text-sm font-semibold text-foreground">
                Coach IA
              </h5>
              <CoachIACard sessions={coaching} />
            </div>

            <div>
              <h5 className="mb-3 text-sm font-semibold text-foreground">
                Évaluations hebdomadaires
              </h5>
              <EvaluationTimeline evaluations={evaluations} />
            </div>
            <JournalStageSection idStage={stage.idStage} />
            {stage.statut === "termine" && (
              <>
                <CertificatCard certificat={certificat} />
                <RecommandationCard
                  recommandation={recommandation}
                  idStage={stage.idStage}
                />
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
