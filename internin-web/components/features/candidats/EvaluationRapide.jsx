"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

import { useState, useRef } from "react";
import { FiStar } from "react-icons/fi";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/lib/store/useToastStore";
import {
  useEvaluationCandidature,
  useUpdateEvaluation,
} from "@/lib/queries/useCandidaturesEntreprise";

const CRITERES = [
  { key: "motivation", labelKey: "entrepriseSpace.candidatures.evalMotivation" },
  { key: "communication", labelKey: "entrepriseSpace.candidatures.evalCommunication" },
  { key: "technique", labelKey: "entrepriseSpace.candidatures.evalTechnical" },
  { key: "presentation", labelKey: "entrepriseSpace.candidatures.evalPresentation" },
];

function valeursDepuisEvaluation(evaluation) {
  return {
    noteGlobale: evaluation?.noteGlobale || 0,
    motivation: evaluation?.motivation || 3,
    communication: evaluation?.communication || 3,
    technique: evaluation?.technique || 3,
    presentation: evaluation?.presentation || 3,
  };
}

export default function EvaluationRapide({ idCandidature }) {
  const { t } = useTranslation();
  const { data: evaluation } = useEvaluationCandidature(idCandidature);
  const updateEvaluation = useUpdateEvaluation(idCandidature);

  const [derniereEvaluation, setDerniereEvaluation] = useState(evaluation);
  const [valeurs, setValeurs] = useState(() =>
    valeursDepuisEvaluation(evaluation),
  );
  const timeoutRef = useRef(null);

  if (evaluation !== derniereEvaluation) {
    setDerniereEvaluation(evaluation);
    setValeurs(valeursDepuisEvaluation(evaluation));
  }

  function sauvegarder(nouvellesValeurs) {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      updateEvaluation.mutate(nouvellesValeurs, {
        onSuccess: () => toast.success(t("entrepriseSpace.candidatures.evalSaved")),
      });
    }, 500);
  }

  function changerEtoile(note) {
    const nouvelles = { ...valeurs, noteGlobale: note };
    setValeurs(nouvelles);
    sauvegarder(nouvelles);
  }

  function changerCurseur(cle, valeur) {
    const nouvelles = { ...valeurs, [cle]: valeur[0] };
    setValeurs(nouvelles);
    sauvegarder(nouvelles);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => changerEtoile(n)}
            className="transition hover:scale-110"
            aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
          >
            <FiStar
              className={`h-6 w-6 ${
                n <= valeurs.noteGlobale
                  ? "fill-accent text-accent"
                  : "text-muted-foreground"
              }`}
            />
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {CRITERES.map((c) => (
          <div key={c.key}>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">{c.labelKey ? t(c.labelKey) : c.label}</span>
              <span className="font-semibold text-muted-foreground">
                {valeurs[c.key]}/5
              </span>
            </div>
            <Slider
              value={[valeurs[c.key]]}
              onValueChange={(v) => changerCurseur(c.key, v)}
              min={1}
              max={5}
              step={1}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
