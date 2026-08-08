"use client";

import { useEffect } from "react";
import { useEvaluations } from "@/lib/queries/useEvaluations";
import {
  AVATAR_COLORS,
  getAvancement,
  getMoyenneDerniereEvaluation,
  getStatutAffichage,
  STATUT_CONFIG,
} from "./stageUtils";

export default function StagiaireListItem({
  stage,
  index,
  isSelected,
  onClick,
  onStatutCalcule,
}) {
  const { data: evaluations } = useEvaluations(stage.idStage);
  const moyenne = getMoyenneDerniereEvaluation(evaluations);
  const statutAffichage = getStatutAffichage(stage, moyenne);
  const avancement = getAvancement(stage);
  const config = STATUT_CONFIG[statutAffichage];
  const couleur = AVATAR_COLORS[index % AVATAR_COLORS.length];

  // Remonte le statut calculé au parent APRÈS le rendu (jamais pendant),
  // pour respecter la règle React : pas de setState en cours de rendu.
  useEffect(() => {
    if (onStatutCalcule) onStatutCalcule(stage.idStage, statutAffichage);
  }, [stage.idStage, statutAffichage, onStatutCalcule]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-md border p-4 text-left transition ${
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:border-primary/40"
      }`}
    >
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: couleur }}
          >
            {stage.prenom?.charAt(0)}
            {stage.nom?.charAt(0)}
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {stage.prenom} {stage.nom}
            </p>
            <p className="text-xs text-muted-foreground">
              {stage.titrePoste} · {stage.nomUniversite || "-"}
            </p>
          </div>
        </div>
        <span
          className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${config.color}`}
        >
          {config.label}
        </span>
      </div>

      <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
        <span>Avancement</span>
        <span className="font-semibold text-foreground">{avancement}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${config.bar}`}
          style={{ width: `${avancement}%` }}
        />
      </div>

      {stage.nomTuteur && (
        <p className="mt-2 text-xs text-muted-foreground">
          Tuteur : {stage.nomTuteur}
        </p>
      )}
    </button>
  );
}
