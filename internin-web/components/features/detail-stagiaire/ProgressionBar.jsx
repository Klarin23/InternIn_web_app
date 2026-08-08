"use client";

import { useState } from "react";
import { FiCheck, FiLoader } from "react-icons/fi";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useUpdateProgressionManuelle } from "@/lib/queries/useSuperviseur";

export default function ProgressionBar({
  idStage,
  progressionManuelle,
  progressionCalculee,
}) {
  const valeurInitiale = progressionManuelle ?? progressionCalculee;
  const [valeur, setValeur] = useState(valeurInitiale);
  const mutation = useUpdateProgressionManuelle(idStage);

  const modifie = valeur !== valeurInitiale;

  return (
    <div className="rounded-md border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">
          Progression du stage
        </h2>
        <span className="text-xl font-bold text-primary">{valeur}%</span>
      </div>

      <Slider
        value={[valeur]}
        onValueChange={([v]) => setValeur(v)}
        min={0}
        max={100}
        step={5}
      />

      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {progressionManuelle !== null
            ? "Valeur définie manuellement par vous."
            : `Calculée automatiquement selon les dates (${progressionCalculee}%) — ajustez-la si besoin.`}
        </p>
        {modifie && (
          <Button
            type="button"
            size="sm"
            className="h-8 rounded-sm px-3 text-xs"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate(valeur)}
          >
            {mutation.isPending ? (
              <FiLoader className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <FiCheck className="h-3.5 w-3.5" />
                Enregistrer
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
