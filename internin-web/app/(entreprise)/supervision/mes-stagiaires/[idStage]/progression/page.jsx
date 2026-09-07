"use client";

import { SupervisionProvider } from "@/lib/supervision/SupervisionContext";
import Page from "@/app/(superviseur)/mes-stagiaires/[idStage]/progression/page";

export default function EntrepriseProgressionPage() {
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
