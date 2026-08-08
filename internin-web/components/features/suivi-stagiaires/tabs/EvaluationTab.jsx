import EvaluationTimeline from "@/components/features/stage/EvaluationTimeline";
import SoumettreEvaluationDialog from "@/components/features/stage/SoumettreEvaluationDialog";
import { useEvaluations } from "@/lib/queries/useEvaluations";

export default function EvaluationTab({ stage }) {
  const { data: evaluations } = useEvaluations(stage.idStage);

  return (
    <div className="space-y-4">
      {stage.statut === "actif" && (
        <div className="flex justify-end">
          <SoumettreEvaluationDialog
            idStage={stage.idStage}
            stagiaireNom={`${stage.prenom} ${stage.nom}`}
          />
        </div>
      )}
      <EvaluationTimeline evaluations={evaluations} />
    </div>
  );
}
