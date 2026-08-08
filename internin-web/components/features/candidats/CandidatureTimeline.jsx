"use client";

import { FiCheck } from "react-icons/fi";
import { useHistoriqueCandidature } from "@/lib/queries/useCandidaturesEntreprise";

function formatHeure(date) {
  return new Date(date).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
function formatDateCourte(date) {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
}

export default function CandidatureTimeline({ idCandidature }) {
  const { data: historique, isLoading } =
    useHistoriqueCandidature(idCandidature);

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">
        Chargement de la chronologie...
      </p>
    );
  }
  if (!historique || historique.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucun évènement pour le moment.
      </p>
    );
  }

  return (
    <div className="relative space-y-4 pl-1">
      <div className="absolute bottom-2 left-[43px] top-2 w-px bg-border" />
      {historique.map((event) => (
        <div key={event.idActivite} className="relative flex items-start gap-3">
          <div className="w-11 flex-shrink-0 pt-0.5 text-right">
            <p className="text-xs font-medium tabular-nums text-foreground">
              {formatHeure(event.dateAction)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {formatDateCourte(event.dateAction)}
            </p>
          </div>
          <span className="relative z-10 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-success text-white">
            <FiCheck className="h-3 w-3" />
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-foreground">
              {event.action}
            </p>
            {event.nomMembre && (
              <p className="text-xs text-muted-foreground">
                par {event.nomMembre}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
