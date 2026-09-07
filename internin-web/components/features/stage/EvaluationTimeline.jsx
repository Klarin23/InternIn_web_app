"use client";

import { FiStar } from "react-icons/fi";
import { useTranslation } from "@/lib/i18n/useTranslation";

const CRITERES = [
  ["noteAssiduite", "noteAssiduite"],
  ["noteCommunication", "noteCommunication"],
  ["noteInitiative", "noteInitiative"],
  ["noteProfessionnalisme", "noteProfessionnalisme"],
  ["noteTravailEquipe", "noteTravailEquipe"],
  ["notePerformanceTechnique", "noteCompetences"],
];

export default function EvaluationTimeline({ evaluations }) {
  const { t } = useTranslation();
  if (!evaluations || evaluations.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("stagiaireSpace.stage.noEvaluations")}
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
            {t("stagiaireSpace.stage.week", { n: evalu.numeroSemaine })}
          </h6>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CRITERES.map(([key, labelKey]) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-sm bg-muted/50 px-3 py-2 text-xs"
              >
                <span className="text-muted-foreground">
                  {t(`stagiaireSpace.stage.${labelKey}`)}
                </span>
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
