
"use client";
import { useTranslation } from "@/lib/i18n/useTranslation";


import { usePathname, useParams } from "next/navigation";

import { FiLoader } from "react-icons/fi";
import AppHeader from "@/components/layout/AppHeader";
import DetailStagiaireHeader from "@/components/features/detail-stagiaire/DetailStagiaireHeader";
import DetailStagiaireTabs from "@/components/features/detail-stagiaire/DetailStagiaireTabs";
import ProgressionBar from "@/components/features/detail-stagiaire/ProgressionBar";
import ObjectifsPanel from "@/components/features/detail-stagiaire/ObjectifsPanel";
import TachesPanel from "@/components/features/detail-stagiaire/TachesPanel";
import CompetencesAcquisesPanel from "@/components/features/detail-stagiaire/CompetencesAcquisesPanel";
import ObservationsPanel from "@/components/features/detail-stagiaire/ObservationsPanel";
import {
  useDetailStagiaire,
  useProgression,
  useJournalSuperviseur,
} from "@/lib/queries/useSuperviseur";
import { useSupervisionContext } from "@/lib/supervision/SupervisionContext";
import { Button } from "@/components/ui/button";


function resolveSupervisionPaths(pathname) {
  const isEntreprisePath = pathname?.startsWith("/supervision/mes-stagiaires");
  const basePath = isEntreprisePath
    ? "/supervision/mes-stagiaires"
    : "/mes-stagiaires";
  const segments = (pathname || "").split("/").filter(Boolean);
  const idx = segments.indexOf("mes-stagiaires");
  const idStage = idx >= 0 ? segments[idx + 1] : undefined;
  return { basePath, idStage, isEntreprisePath };
}

export default function ProgressionStagiairePage() {
  const { t } = useTranslation();
  const pathname = usePathname();
  useSupervisionContext(); // conserve le contexte actif (Entreprise / Superviseur)
  const { basePath, idStage: idFromPath } = resolveSupervisionPaths(pathname);
  const routeParams = useParams();
  const idStage = idFromPath || routeParams?.idStage;
  const { data: detail } = useDetailStagiaire(idStage);
  const { data: progression, isLoading, error, refetch } = useProgression(idStage);
  const { data: journal } = useJournalSuperviseur(idStage);

  if (isLoading) {
    return (
      <div className="space-y-4 px-6 py-6">
        <div className="h-36 animate-pulse rounded-2xl bg-muted/70" />
        <div className="h-32 animate-pulse rounded-2xl bg-muted/60" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-48 animate-pulse rounded-2xl bg-muted/50" />
          <div className="h-48 animate-pulse rounded-2xl bg-muted/50" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="font-semibold">{t("mesStagiaires.progression.loadError")}</p>
        <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4 rounded-lg"
          onClick={() => refetch()}
        >
          {t("mesStagiaires.progression.retry")}
        </Button>
      </div>
    );
  }

  const stagiaire = detail?.stagiaire;
  const stage = detail?.stage;
  const objectifs = progression?.objectifs || [];
  const taches = progression?.taches || [];

  const stats = stagiaire
    ? {
        progression:
          progression?.progressionManuelle ?? progression?.progressionCalculee,
        objectifsFaits: objectifs.filter((o) => o.statut === "realise").length,
        objectifsTotal: objectifs.length || null,
        tachesFaites: taches.filter((task) => task.statut === "terminee").length,
        tachesTotal: taches.length || null,
        journalCount: Array.isArray(journal) ? journal.length : null,
      }
    : undefined;

  return (
    <>
      <AppHeader
        breadcrumb={[
          { label: t("mesStagiaires.header.myInterns"), href: basePath },
          {
            label: stagiaire
              ? `${stagiaire.prenom} ${stagiaire.nom}`
              : "…",
          },
          { label: t("mesStagiaires.tabs.progression") },
        ]}
      />
      <div className="space-y-6 px-4 py-6 sm:px-6">
        {stagiaire && stage && (
          <DetailStagiaireHeader
            stagiaire={stagiaire}
            stage={stage}
            stats={stats}
            meta={{
              titrePoste: detail?.offre?.titre,
              ville: stagiaire.ville,
            }}
          />
        )}
        <DetailStagiaireTabs idStage={idStage} />

        <div className="space-y-5">
          <ProgressionBar
            idStage={idStage}
            progressionManuelle={progression.progressionManuelle}
            progressionCalculee={progression.progressionCalculee}
          />

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <ObjectifsPanel idStage={idStage} objectifs={objectifs} />
            <TachesPanel idStage={idStage} taches={taches} objectifs={objectifs} />
          </div>

          <CompetencesAcquisesPanel
            idStage={idStage}
            competencesAcquises={progression.competencesAcquises}
          />

          <ObservationsPanel
            idStage={idStage}
            observations={progression.observations}
          />
        </div>
      </div>
    </>
  );
}