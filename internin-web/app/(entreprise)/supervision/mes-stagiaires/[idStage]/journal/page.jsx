"use client";

import { SupervisionProvider } from "@/lib/supervision/SupervisionContext";
import Page from "@/app/(superviseur)/mes-stagiaires/[idStage]/journal/page";

export default function EntrepriseJournalPage() {
  return (
    <SupervisionProvider
      basePath="/supervision/mes-stagiaires"
      evaluationsPath="/supervision/evaluations"
      calendrierPath="/supervision/calendrier"
      roleLabel="Entreprise"
      isEntreprise
    >
      <Page />
    </SupervisionProvider>
  );
}
