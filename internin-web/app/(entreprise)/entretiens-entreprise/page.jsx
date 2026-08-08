"use client";

import { FiLoader, FiCalendar } from "react-icons/fi";
import AppHeader from "@/components/layout/AppHeader";
import EntretienCardEntreprise from "@/components/features/entretiens/EntretienCardEntreprise";
import { useEntretiensEntreprise } from "@/lib/queries/useEntretiens";

// Ce menu ne montre que les entretiens confirmés par l'entreprise (une fois
// que le candidat a validé et que l'entreprise a confirmé la planification).
// Les entretiens encore en cours de planification (planifié / validé / à
// reprogrammer) se gèrent depuis la fiche du candidat, dans le menu
// "Candidatures". Chaque carte reste cliquable/actionnable : on peut la
// marquer "Terminé", puis faire l'offre finale directement depuis ici.
const STATUTS_VISIBLES = ["confirme", "termine"];

export default function EntretiensEntreprisePage() {
  const { data: entretiens, isLoading } = useEntretiensEntreprise();

  const entretiensConfirmes = (entretiens || [])
    .filter((e) => STATUTS_VISIBLES.includes(e.statut))
    .sort((a, b) => new Date(a.dateHeure) - new Date(b.dateHeure));

  const aVenir = entretiensConfirmes.filter((e) => e.statut === "confirme");
  const termines = entretiensConfirmes.filter((e) => e.statut === "termine");

  return (
    <>
      <AppHeader breadcrumb={[{ label: "Entretiens" }]} />
      <div className="px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Entretiens</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {entretiensConfirmes.length} entretien
            {entretiensConfirmes.length > 1 ? "s" : ""} confirmé
            {entretiensConfirmes.length > 1 ? "s" : ""}
          </p>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <FiLoader className="h-5 w-5 animate-spin" />
            Chargement...
          </div>
        )}

        {entretiensConfirmes.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <FiCalendar className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              Aucun entretien confirmé pour l&apos;instant
            </p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Les entretiens en attente de réponse ou de confirmation du
              candidat restent visibles depuis le menu Candidatures.
            </p>
          </div>
        )}

        {aVenir.length > 0 && (
          <div className="mb-8">
            <h5 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              À venir
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
                {aVenir.length}
              </span>
            </h5>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {aVenir.map((e) => (
                <EntretienCardEntreprise key={e.idEntretien} entretien={e} />
              ))}
            </div>
          </div>
        )}

        {termines.length > 0 && (
          <div>
            <h5 className="mb-3 text-sm font-semibold text-foreground">
              Terminés — prêts pour une offre finale
            </h5>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {termines.map((e) => (
                <EntretienCardEntreprise key={e.idEntretien} entretien={e} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
