import { FiStar } from "react-icons/fi";

const CRITERES = [
  ["noteAssiduite", "Assiduité"],
  ["noteCommunication", "Communication"],
  ["noteInitiative", "Initiative"],
  ["noteProfessionnalisme", "Professionnalisme"],
  ["noteTravailEquipe", "Travail d'équipe"],
  ["notePerformanceTechnique", "Performance technique"],
];

export default function EvaluationTimeline({ evaluations }) {
  if (!evaluations || evaluations.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucune évaluation soumise pour l&apos;instant.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {[...evaluations].reverse().map((evalu) => (
        <div
          key={evalu.idEvaluation}
          className="rounded-md border border-border bg-card p-5"
        >
          <h6 className="mb-3 font-semibold text-foreground">
            Semaine {evalu.numeroSemaine}
          </h6>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CRITERES.map(([key, label]) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-sm bg-muted/50 px-3 py-2 text-xs"
              >
                <span className="text-muted-foreground">{label}</span>
                <span className="flex items-center gap-0.5 font-semibold text-foreground">
                  {evalu[key]}
                  <FiStar className="h-3 w-3 fill-accent text-accent" />
                </span>
              </div>
            ))}
          </div>
          {evalu.commentaires && (
            <p className="mt-3 rounded-sm bg-muted/30 p-3 text-sm text-muted-foreground">
              {evalu.commentaires}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
