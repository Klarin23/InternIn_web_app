"use client";

import { useState } from "react";
import { FiCheck, FiLoader } from "react-icons/fi";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useUpdateProgressionManuelle } from "@/lib/queries/useSuperviseur";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function ProgressionBar({
  idStage,
  progressionManuelle,
  progressionCalculee,
}) {
  const { t } = useTranslation();
  const valeurInitiale = progressionManuelle ?? progressionCalculee;
  const [valeur, setValeur] = useState(valeurInitiale);
  const mutation = useUpdateProgressionManuelle(idStage);

  const modifie = valeur !== valeurInitiale;

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">
          {t("mesStagiaires.progression.title")}
        </h2>
        <span className="text-xl font-bold text-primary">{valeur}%</span>
      </div>

      <div className="mb-4 h-2.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
          style={{ width: `${valeur}%` }}
        />
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
            ? t("mesStagiaires.progression.manualHint")
            : t("mesStagiaires.progression.autoHint", { pct: progressionCalculee })}
        </p>
        {modifie && (
          <Button
            type="button"
            size="sm"
            className="h-8 rounded-lg px-3 text-xs gap-1.5"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate(valeur)}
          >
            {mutation.isPending ? (
              <FiLoader className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <FiCheck className="h-3.5 w-3.5" />
                {t("mesStagiaires.progression.save")}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
