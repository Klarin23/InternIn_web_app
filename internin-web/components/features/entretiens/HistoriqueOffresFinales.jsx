"use client";

import { FiClock, FiXCircle } from "react-icons/fi";
import { useHistoriqueOffresFinales } from "@/lib/queries/useOffresFinales";

const DUREE_LABELS = {
  "1_mois": "1 mois",
  "2_mois": "2 mois",
  "3_mois": "3 mois",
};

// Affiche les tentatives d'offre finale déjà rejetées par l'administration
// pour cet entretien. Sans cet historique, la carte entreprise revient
// silencieusement à "Faire une offre" après un rejet, sans laisser de trace
// visible du refus précédent — ce composant comble ce manque.
export default function HistoriqueOffresFinales({ idEntretien }) {
  const { data: historique, isLoading } =
    useHistoriqueOffresFinales(idEntretien);

  if (isLoading || !historique || historique.length === 0) return null;

  return (
    <div className="mb-3 space-y-2 rounded-sm border border-destructive/20 bg-destructive/5 p-3.5">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-destructive">
        <FiXCircle className="h-3.5 w-3.5" />
        {historique.length} tentative{historique.length > 1 ? "s" : ""} rejetée
        {historique.length > 1 ? "s" : ""} par l&apos;administration
      </p>
      <ul className="space-y-1.5">
        {historique.map((h) => (
          <li
            key={h.idOffreFinale}
            className="flex items-center justify-between rounded-sm bg-card px-3 py-2 text-xs"
          >
            <div>
              <p className="font-medium text-foreground">{h.intitulePoste}</p>
              <p className="text-muted-foreground">
                {DUREE_LABELS[h.dureeStage] || h.dureeStage}
                {h.volumeHoraireHebdo
                  ? ` · ${h.volumeHoraireHebdo}h/semaine`
                  : ""}
              </p>
            </div>
            <span className="flex items-center gap-1 text-muted-foreground">
              <FiClock className="h-3 w-3" />
              {h.dateValidation
                ? new Date(h.dateValidation).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                  })
                : "—"}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-muted-foreground">
        Vous pouvez soumettre une nouvelle proposition ci-dessous.
      </p>
    </div>
  );
}
