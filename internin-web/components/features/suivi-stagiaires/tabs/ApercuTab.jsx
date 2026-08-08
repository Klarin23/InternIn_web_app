import { FiPhone, FiMail } from "react-icons/fi";
import { useEvaluations } from "@/lib/queries/useEvaluations";
import { getAvancement, getMoyenneDerniereEvaluation } from "../stageUtils";

const CRITERES = [
  ["noteAssiduite", "Ponctualité"],
  ["noteCommunication", "Communication"],
  ["noteInitiative", "Initiative"],
  ["noteProfessionnalisme", "Qualité du travail"],
  ["noteTravailEquipe", "Intégration équipe"],
  ["notePerformanceTechnique", "Autonomie"],
];

function Etoiles({ note }) {
  return (
    <span className="text-accent">
      {"★".repeat(Math.round(note))}
      <span className="text-muted-foreground">
        {"★".repeat(5 - Math.round(note))}
      </span>
    </span>
  );
}

export default function ApercuTab({ stage }) {
  const { data: evaluations } = useEvaluations(stage.idStage);
  const avancement = getAvancement(stage);
  const moyenne = getMoyenneDerniereEvaluation(evaluations);
  const derniere = evaluations?.[evaluations.length - 1];

  return (
    <div className="space-y-6">
      {/* Coordonnées — visibles ici uniquement car le stage est actif,
          conforme à la règle de confidentialité du Schéma BDD (§12) */}
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="flex items-center gap-1.5 rounded-full bg-primary/5 px-3 py-1.5 text-primary">
          <FiPhone className="h-3.5 w-3.5" />
          {stage.telephone}
        </span>
        <span className="flex items-center gap-1.5 rounded-full bg-primary/5 px-3 py-1.5 text-primary">
          <FiMail className="h-3.5 w-3.5" />
          {stage.email}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-md bg-muted/50 p-4 text-center">
          <div className="text-xl font-bold text-foreground">{avancement}%</div>
          <div className="text-xs text-muted-foreground">Avancement</div>
        </div>
        <div className="rounded-md bg-muted/50 p-4 text-center">
          <div className="text-xl font-bold text-foreground">
            {evaluations?.length ?? 0}
          </div>
          <div className="text-xs text-muted-foreground">
            Évaluations soumises
          </div>
        </div>
        <div className="rounded-md bg-muted/50 p-4 text-center">
          <div className="text-xl font-bold text-foreground">
            {moyenne ? moyenne.toFixed(1) : "—"}/5
          </div>
          <div className="text-xs text-muted-foreground">Note moy.</div>
        </div>
      </div>

      <div>
        <h6 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Compétences évaluées{" "}
          {derniere ? `(semaine ${derniere.numeroSemaine})` : ""}
        </h6>
        {!derniere ? (
          <p className="text-sm text-muted-foreground">
            Aucune évaluation soumise pour l&apos;instant.
          </p>
        ) : (
          <div className="space-y-2">
            {CRITERES.map(([key, label]) => (
              <div
                key={key}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-foreground">{label}</span>
                <Etoiles note={derniere[key]} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
