"use client";

// Panneau compact d'état d'entretien, utilisé dans la fiche candidat (fenêtre
// ouverte depuis la liste des candidats d'une offre). Reprend la même logique
// et les mêmes actions que EntretienCardEntreprise (menu "Entretiens"), pour
// que l'entreprise puisse répondre à une reprogrammation ou confirmer un
// entretien validé sans devoir quitter la fiche du candidat.

import { useState } from "react";
import { FiCalendar, FiLoader, FiClock } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useUpdateEntretienEntreprise,
} from "@/lib/queries/useEntretiens";

const STATUT_LABELS = {
  planifie: "En attente de la réponse du candidat",
  valide: "Validé par le candidat — en attente de confirmation",
  confirme: "Entretien confirmé",
  reprogramme: "Le candidat demande une reprogrammation",
};
const STATUT_COLORS = {
  planifie: "bg-[#FEF3C7] text-[#B45309]",
  valide: "bg-[#CFFAFE] text-[#0E7490]",
  confirme: "bg-success/10 text-green-700",
  reprogramme: "bg-[#FFEDD5] text-[#C2410C]",
};

export default function EntretienStatutPanel({ entretien }) {
  const [nouvelleDate, setNouvelleDate] = useState("");
  const updateMutation = useUpdateEntretienEntreprise();

  const dateFormatee = new Date(entretien.dateHeure).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="space-y-2.5 rounded-sm border border-border bg-muted/30 p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <FiClock className="h-3.5 w-3.5" />
          {dateFormatee}
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUT_COLORS[entretien.statut]}`}
        >
          {STATUT_LABELS[entretien.statut]}
        </span>
      </div>

      {/* Le candidat a demandé une reprogrammation -> proposer une nouvelle date */}
      {entretien.statut === "reprogramme" && (
        <div className="space-y-2">
          <p className="rounded-sm bg-accent/10 p-2.5 text-xs text-amber-800">
            <b>Proposition du candidat</b> —{" "}
            {new Date(entretien.dateHeureProposee).toLocaleString("fr-FR", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
            <br />
            {entretien.retourEntretien}
          </p>
          <div className="flex gap-2">
            <Input
              type="datetime-local"
              value={nouvelleDate}
              onChange={(e) => setNouvelleDate(e.target.value)}
              className="h-10 rounded-sm"
            />
            <Button
              type="button"
              size="sm"
              disabled={!nouvelleDate || updateMutation.isPending}
              onClick={() =>
                updateMutation.mutate({
                  id: entretien.idEntretien,
                  payload: { dateHeure: nouvelleDate },
                })
              }
              className="flex-shrink-0 rounded-sm"
            >
              {updateMutation.isPending ? (
                <FiLoader className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <FiCalendar className="h-4 w-4" />
                  Replanifier
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* En attente côté candidat : rien à faire pour l'instant */}
      {entretien.statut === "planifie" && (
        <p className="text-xs text-muted-foreground">
          Le candidat n&apos;a pas encore répondu à la proposition
          d&apos;entretien.
        </p>
      )}

      {/* Confirmé : l'entreprise n'a plus qu'à mener l'entretien, puis le
          clôturer depuis le menu "Entretiens" une fois réalisé. */}
      {entretien.statut === "confirme" && (
        <p className="text-xs text-muted-foreground">
          Une fois l&apos;entretien réalisé, marquez-le &quot;Terminé&quot;
          depuis le menu Entretiens pour pouvoir faire une offre finale.
        </p>
      )}
    </div>
  );
}
