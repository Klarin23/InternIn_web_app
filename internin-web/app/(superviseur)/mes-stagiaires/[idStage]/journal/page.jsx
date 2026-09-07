
"use client";
import { useTranslation } from "@/lib/i18n/useTranslation";


import { usePathname, useParams } from "next/navigation";

import AppHeader from "@/components/layout/AppHeader";
import DetailStagiaireHeader from "@/components/features/detail-stagiaire/DetailStagiaireHeader";
import DetailStagiaireTabs from "@/components/features/detail-stagiaire/DetailStagiaireTabs";
import JournalModerationPanel from "@/components/features/detail-stagiaire/JournalModerationPanel";
import {
  useDetailStagiaire,
  useJournalSuperviseur,
  useProgression,
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

export default function JournalStagiairePage() {
  const { t } = useTranslation();
  const pathname = usePathname();
  useSupervisionContext();
  const { basePath, idStage: idFromPath } = resolveSupervisionPaths(pathname);
  const routeParams = useParams();
  const idStage = idFromPath || routeParams?.idStage;
  const { data: detail } = useDetailStagiaire(idStage);
  const { data: progression } = useProgression(idStage);
  const { data: entrees, isLoading, error, refetch } = useJournalSuperviseur(
    idStage,
  );

  if (isLoading) {
    return (
      <div className="space-y-4 px-6 py-6">
        <div className="h-36 animate-pulse rounded-2xl bg-muted/70" />
        <div className="h-24 animate-pulse rounded-2xl bg-muted/50" />
        <div className="h-40 animate-pulse rounded-2xl bg-muted/40" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="font-semibold">{t("mesStagiaires.journal.loadError")}</p>
        <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4 rounded-lg"
          onClick={() => refetch()}
        >
          {t("mesStagiaires.journal.retry")}
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
        journalCount: Array.isArray(entrees) ? entrees.length : null,
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
          { label: t("mesStagiaires.journal.breadcrumb") },
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
        <JournalModerationPanel idStage={idStage} entrees={entrees} />
      </div>
    </>
  );
}