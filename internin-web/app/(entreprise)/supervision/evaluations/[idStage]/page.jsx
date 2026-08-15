"use client";

import { SupervisionProvider } from "@/lib/supervision/SupervisionContext";
import EvalDetailPage from "@/app/(superviseur)/mes-stagiaires/evaluations/[idStage]/page";

export default function EntrepriseEvalDetailPage({ params, searchParams } = {}) {
  return (
    <SupervisionProvider
      basePath="/supervision/mes-stagiaires"
      evaluationsPath="/supervision/evaluations"
      calendrierPath="/supervision/calendrier"
      roleLabel="Entreprise"
      isEntreprise
    >
      <EvalDetailPage params={params} searchParams={searchParams} />
    </SupervisionProvider>
  );
}
