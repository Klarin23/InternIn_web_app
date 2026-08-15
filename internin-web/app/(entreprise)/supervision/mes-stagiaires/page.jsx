"use client";

import { SupervisionProvider } from "@/lib/supervision/SupervisionContext";
import MesStagiairesPage from "@/app/(superviseur)/mes-stagiaires/page";

/**
 * Espace Entreprise → Supervision → Mes stagiaires
 * Réutilise intégralement la page Superviseur (liste + vue comparative).
 * Les liens internes pointent vers /supervision/mes-stagiaires/... via le contexte.
 */
export default function EntrepriseMesStagiairesPage() {
  return (
    <SupervisionProvider
      basePath="/supervision/mes-stagiaires"
      evaluationsPath="/supervision/evaluations"
      calendrierPath="/supervision/calendrier"
      roleLabel="Entreprise"
      isEntreprise
    >
      <MesStagiairesPage />
    </SupervisionProvider>
  );
}
