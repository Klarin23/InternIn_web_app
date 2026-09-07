"use client";

import { FiZap, FiTrendingUp, FiTarget, FiCompass } from "react-icons/fi";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function CoachIACard({ sessions }) {
  const { t } = useTranslation();
  if (!sessions || sessions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("stagiaireSpace.stage.coachWaiting")}
        soumise.
      </p>
    );
  }

  const derniere = sessions[sessions.length - 1];

  return (
    <div className="rounded-md border border-secondary/30 bg-secondary/5 p-5">
      <div className="mb-4 flex items-center gap-2">
        <FiZap className="h-5 w-5 text-secondary" />
        <h6 className="font-semibold text-foreground">
          Coach IA — Semaine {derniere.numeroSemaine}
        </h6>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex gap-2.5">
          <FiTrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-muted-foreground">
            <b className="text-foreground">Force : </b>
            {derniere.forces}
          </p>
        </div>
        <div className="flex gap-2.5">
          <FiTarget className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <p className="text-muted-foreground">
            <b className="text-foreground">{t("stagiaireSpace.stage.coachImprovement")} </b>
            {derniere.axesAmelioration}
          </p>
        </div>
        <div className="flex gap-2.5">
          <FiCompass className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
          <p className="text-muted-foreground">
            <b className="text-foreground">{t("stagiaireSpace.stage.coachAction")} </b>
            {derniere.actionsRecommandees}
          </p>
        </div>
      </div>

      <p className="mt-4 border-t border-secondary/20 pt-3 text-xs text-muted-foreground">
        {derniere.resumeProgression}
      </p>
    </div>
  );
}
