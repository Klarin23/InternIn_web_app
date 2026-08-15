"use client";

import { SupervisionProvider } from "@/lib/supervision/SupervisionContext";
import CalendrierPage from "@/app/(superviseur)/calendrier-supervision/page";

export default function EntrepriseCalendrierPage() {
  return (
    <SupervisionProvider
      basePath="/supervision/mes-stagiaires"
      evaluationsPath="/supervision/evaluations"
      calendrierPath="/supervision/calendrier"
      roleLabel="Entreprise"
      isEntreprise
    >
      <CalendrierPage />
    </SupervisionProvider>
  );
}
