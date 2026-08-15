"use client";

import { SupervisionProvider } from "@/lib/supervision/SupervisionContext";
import ProgressionPage from "@/app/(superviseur)/mes-stagiaires/[idStage]/progression/page";

export default function EntrepriseProgressionPage({ params, searchParams } = {}) {
  return (
    <SupervisionProvider
      basePath="/supervision/mes-stagiaires"
      evaluationsPath="/supervision/evaluations"
      calendrierPath="/supervision/calendrier"
      roleLabel="Entreprise"
      isEntreprise
    >
      <ProgressionPage params={params} searchParams={searchParams} />
    </SupervisionProvider>
  );
}
