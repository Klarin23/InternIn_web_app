"use client";

import { SupervisionProvider } from "@/lib/supervision/SupervisionContext";
import DetailPage from "@/app/(superviseur)/mes-stagiaires/[idStage]/page";

export default function EntrepriseDetailStagiairePage({ params, searchParams } = {}) {
  return (
    <SupervisionProvider
      basePath="/supervision/mes-stagiaires"
      evaluationsPath="/supervision/evaluations"
      calendrierPath="/supervision/calendrier"
      roleLabel="Entreprise"
      isEntreprise
    >
      <DetailPage params={params} searchParams={searchParams} />
    </SupervisionProvider>
  );
}
