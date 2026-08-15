"use client";

import { SupervisionProvider } from "@/lib/supervision/SupervisionContext";
import EvaluationsPage from "@/app/(superviseur)/mes-stagiaires/evaluations/page";

export default function EntrepriseEvaluationsPage() {
  return (
    <SupervisionProvider
      basePath="/supervision/mes-stagiaires"
      evaluationsPath="/supervision/evaluations"
      calendrierPath="/supervision/calendrier"
      roleLabel="Entreprise"
      isEntreprise
    >
      <EvaluationsPage />
    </SupervisionProvider>
  );
}
