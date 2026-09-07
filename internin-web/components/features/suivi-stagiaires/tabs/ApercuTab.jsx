"use client";
import { useTranslation } from "@/lib/i18n/useTranslation";

import { useEvaluations } from "@/lib/queries/useEvaluations";
import { Button } from "@/components/ui/button";
import OverviewHeader from "./apercu/OverviewHeader";
import OverviewStats from "./apercu/OverviewStats";
import OverviewProgress from "./apercu/OverviewProgress";
import OverviewPerformance from "./apercu/OverviewPerformance";
import OverviewInfo from "./apercu/OverviewInfo";
import OverviewHighlights from "./apercu/OverviewHighlights";
import OverviewActivity from "./apercu/OverviewActivity";
import OverviewSkeleton from "./apercu/OverviewSkeleton";
import {
  getAvancement,
  getJoursRestants,
  getMoyenneDerniereEvaluation,
  buildHighlights,
  buildRecentActivity,
} from "./apercu/apercuUtils";

export default function ApercuTab({ stage }) {
  const { t, locale } = useTranslation();
  const {
    data: evaluations,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useEvaluations(stage?.idStage);

  const list = Array.isArray(evaluations) ? evaluations : [];
  const avancement = stage ? getAvancement(stage) : 0;
  const moyenne = getMoyenneDerniereEvaluation(list);
  const joursRestants = stage ? getJoursRestants(stage) : null;
  const stageTermine = stage?.statut === "termine";
  const highlights = stage
    ? buildHighlights(stage, list, avancement, moyenne)
    : [];
  const activity = buildRecentActivity(list);

  if (isLoading) {
    return <OverviewSkeleton />;
  }

  // Erreur évaluations : on affiche quand même le stage (données parent)
  // avec une alerte non bloquante pour la partie performance.
  return (
    <div className="space-y-5">
      <OverviewHeader stage={stage} moyenne={moyenne} />

      <OverviewStats
        avancement={avancement}
        moyenne={isError ? null : moyenne}
        evalCount={isError ? 0 : list.length}
        joursRestants={joursRestants}
        stageTermine={stageTermine}
      />

      <OverviewProgress
        stage={stage}
        avancement={avancement}
        moyenne={moyenne}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {isError ? (
          <div className="rounded-2xl border border-destructive/25 bg-destructive/5 px-5 py-6 text-center lg:col-span-1">
            <p className="text-sm font-semibold text-foreground">
              {t("suivi.eval.loadErrorShort")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("suivi.overview.otherInfoAvailable")}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 rounded-lg"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              {isFetching ? t("suivi.common.loading") : t("suivi.common.retry")}
            </Button>
          </div>
        ) : (
          <OverviewPerformance moyenne={moyenne} evaluations={list} />
        )}
        <OverviewInfo stage={stage} />
      </div>

      <OverviewHighlights items={highlights} />

      {!isError && <OverviewActivity events={activity} />}
    </div>
  );
}
