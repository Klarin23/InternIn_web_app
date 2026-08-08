"use client";

import { useState } from "react";
import {
  FiChevronDown,
  FiEye,
  FiEdit3,
  FiFileText,
  FiMessageSquare,
  FiCalendar,
  FiClock,
} from "react-icons/fi";
import { useHistoriqueCandidature } from "@/lib/queries/useCandidaturesEntreprise";

function iconePourAction(action) {
  if (action.includes("Profil consulté")) return FiEye;
  if (action.includes("CV")) return FiFileText;
  if (action.includes("note")) return FiMessageSquare;
  if (action.includes("Entretien")) return FiCalendar;
  return FiEdit3;
}

function formatDateHeure(date) {
  return new Date(date).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoriqueComplet({ idCandidature }) {
  const [ouvert, setOuvert] = useState(false);
  const { data: historique } = useHistoriqueCandidature(idCandidature);

  return (
    <div className="rounded-md border border-border">
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
          <FiClock className="h-4 w-4 text-muted-foreground" />
          Historique complet
          {historique && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
              {historique.length}
            </span>
          )}
        </span>
        <FiChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${ouvert ? "rotate-180" : ""}`}
        />
      </button>

      {ouvert && (
        <div className="divide-y divide-border/60 border-t border-border">
          {!historique || historique.length === 0 ? (
            <p className="px-4 py-4 text-sm text-muted-foreground">
              Aucun évènement enregistré.
            </p>
          ) : (
            [...historique].reverse().map((event) => {
              const Icone = iconePourAction(event.action);
              return (
                <div
                  key={event.idActivite}
                  className="flex items-start gap-3 px-4 py-3"
                >
                  <Icone className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">{event.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.nomMembre
                        ? `par ${event.nomMembre}`
                        : "par le candidat"}{" "}
                      · {formatDateHeure(event.dateAction)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
