"use client";

import { FiLoader, FiInbox, FiActivity } from "react-icons/fi";
import { useActivitesEquipe } from "@/lib/queries/useEquipe";

const ACTION_LABELS = {
  invitation_envoyee: "Invitation envoyée",
  invitation_renvoyee: "Invitation renvoyée",
  invitation_annulee: "Invitation annulée",
  permissions_modifiees: "Rôle / permissions modifiés",
  membre_active: "Membre activé",
  membre_desactive: "Membre désactivé",
  stagiaire_affecte: "Stagiaire affecté à un superviseur",
  affectation_retiree: "Affectation retirée",
  parametres_equipe_modifies: "Paramètres de l'équipe modifiés",
};

export default function ActivitePanel() {
  const { data: activites, isLoading } = useActivitesEquipe();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <FiLoader className="h-5 w-5 animate-spin" />
        Chargement...
      </div>
    );
  }

  if (!activites || activites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <FiInbox className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">
          Aucune activité enregistrée pour le moment
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-border bg-card">
      {activites.map((a) => (
        <div
          key={a.idActivite}
          className="flex items-start gap-3 border-b border-border px-4 py-3.5 text-sm last:border-b-0"
        >
          <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <FiActivity className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-foreground">
              {ACTION_LABELS[a.action] || a.action}
            </span>
            {a.details && (
              <span className="block truncate text-muted-foreground">
                {a.details}
              </span>
            )}
            <span className="block text-xs text-muted-foreground">
              {a.nomAuteur ? `Par ${a.nomAuteur} · ` : ""}
              {new Date(a.dateAction).toLocaleString("fr-FR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}
