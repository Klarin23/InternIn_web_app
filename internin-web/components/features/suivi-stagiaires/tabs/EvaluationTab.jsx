"use client";
import { useTranslation } from "@/lib/i18n/useTranslation";

import { Plus } from "lucide-react";
import SoumettreEvaluationDialog from "@/components/features/stage/SoumettreEvaluationDialog";
import { useEvaluations } from "@/lib/queries/useEvaluations";
import { Button } from "@/components/ui/button";
import EvaluationHeader from "./evaluation/EvaluationHeader";
import EvaluationStats from "./evaluation/EvaluationStats";
import EvaluationCriteriaBars from "./evaluation/EvaluationCriteriaBars";
import EvaluationSummary from "./evaluation/EvaluationSummary";
import EvaluationHistory from "./evaluation/EvaluationHistory";
import EvaluationEmptyState from "./evaluation/EvaluationEmptyState";
import EvaluationSkeleton from "./evaluation/EvaluationSkeleton";
import {
  moyenneGlobale,
  moyennesParCritere,
  progressionPourcent,
  formatRelativeDate,
} from "./evaluation/evaluationUtils";

export default function EvaluationTab({ stage }) {
  const { t, locale } = useTranslation();
  const localeTag = locale === "en" ? "en-GB" : "fr-FR";
  const {
    data: evaluations,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useEvaluations(stage?.idStage);

  const list = Array.isArray(evaluations) ? evaluations : [];
  const sortedByWeek = [...list].sort(
    (a, b) => (a.numeroSemaine || 0) - (b.numeroSemaine || 0),
  );
  const lastEvaluation =
    sortedByWeek.length > 0 ? sortedByWeek[sortedByWeek.length - 1] : null;

  const prochaineSemaine =
    list.length > 0
      ? Math.max(...list.map((e) => e.numeroSemaine || 0)) + 1
      : 1;

  const moyenne = moyenneGlobale(list);
  const averages = moyennesParCritere(list);
  const progression = progressionPourcent(list);
  const lastRelative = lastEvaluation
    ? formatRelativeDate(lastEvaluation.dateSoumission)
    : null;

  const canCreate = stage?.statut === "actif";

  const newEvalAction = canCreate ? (
    <SoumettreEvaluationDialog
      idStage={stage.idStage}
      stagiaireNom={`${stage.prenom || ""} ${stage.nom || ""}`.trim()}
      stagiairePoste={stage.titrePoste}
      numeroSemaine={prochaineSemaine}
      triggerLabel={t("suivi.eval.new")}
      triggerIcon={<Plus className="size-4" aria-hidden />}
    />
  ) : null;

  if (isLoading) {
    return <EvaluationSkeleton />;
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-destructive/25 bg-destructive/5 px-5 py-8 text-center">
        <p className="text-sm font-semibold text-foreground">
          {t("suivi.eval.loadError")}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("suivi.eval.loadErrorHint")}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4 rounded-lg"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          {isFetching ? t("suivi.common.loading") : t("suivi.common.retry")}
        </Button>
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="space-y-5">
        <EvaluationHeader lastEvaluation={null} action={newEvalAction} />
        <EvaluationEmptyState
          action={
            canCreate ? (
              <SoumettreEvaluationDialog
                idStage={stage.idStage}
                stagiaireNom={`${stage.prenom || ""} ${stage.nom || ""}`.trim()}
                stagiairePoste={stage.titrePoste}
                numeroSemaine={1}
                triggerLabel={t("suivi.eval.createFirst")}
                triggerIcon={<Plus className="size-4" aria-hidden />}
              />
            ) : null
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <EvaluationHeader
        lastEvaluation={lastEvaluation}
        action={newEvalAction}
      />

      <EvaluationStats
        moyenne={moyenne}
        count={list.length}
        progression={progression}
        lastRelative={lastRelative}
      />

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <EvaluationCriteriaBars averages={averages} />
        </div>
        <div className="lg:col-span-2">
          <EvaluationSummary moyenne={moyenne} evaluations={list} />
        </div>
      </div>

      <EvaluationHistory evaluations={list} />
    </div>
  );
}
