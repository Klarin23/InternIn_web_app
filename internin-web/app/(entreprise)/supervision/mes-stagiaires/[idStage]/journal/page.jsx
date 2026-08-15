"use client";

import { SupervisionProvider } from "@/lib/supervision/SupervisionContext";
import JournalPage from "@/app/(superviseur)/mes-stagiaires/[idStage]/journal/page";

export default function EntrepriseJournalPage({ params, searchParams } = {}) {
  return (
    <SupervisionProvider
      basePath="/supervision/mes-stagiaires"
      evaluationsPath="/supervision/evaluations"
      calendrierPath="/supervision/calendrier"
      roleLabel="Entreprise"
      isEntreprise
    >
      <JournalPage params={params} searchParams={searchParams} />
    </SupervisionProvider>
  );
}
