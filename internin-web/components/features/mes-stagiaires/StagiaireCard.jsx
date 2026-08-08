"use client";

import Link from "next/link";
import {
  FiCalendar,
  FiClock,
  FiTarget,
  FiCheckSquare,
  FiAlertTriangle,
} from "react-icons/fi";

const STATUT_LABELS = {
  actif: "En cours",
  termine: "Terminé",
  interrompu: "Interrompu",
};

const STATUT_COLORS = {
  actif: "bg-success/10 text-green-700",
  termine: "bg-muted text-muted-foreground",
  interrompu: "bg-destructive/10 text-destructive",
};

const AVATAR_COLORS = [
  "#14B8A6",
  "#5B3DF5",
  "#F59E0B",
  "#3B82F6",
  "#EC4899",
  "#10B981",
  "#F97316",
  "#8B5CF6",
];

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function StagiaireCard({ stagiaire, index }) {
  const couleur = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const initiales =
    `${stagiaire.prenom?.charAt(0) || ""}${stagiaire.nom?.charAt(0) || ""}`.toUpperCase();

  return (
    <Link
      href={`/mes-stagiaires/${stagiaire.idStage}`}
      className="block rounded-md border border-border bg-card p-5 transition-all duration-200 hover:border-primary/40 hover:shadow-md motion-safe:hover:-translate-y-0.5"
    >
      <div className="mb-4 flex items-start gap-3">
        {stagiaire.photoProfilUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={stagiaire.photoProfilUrl}
            alt={`${stagiaire.prenom} ${stagiaire.nom}`}
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ backgroundColor: couleur }}
          >
            {initiales}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate font-semibold text-foreground">
              {stagiaire.prenom} {stagiaire.nom}
            </p>
            {stagiaire.alerte && (
              <FiAlertTriangle
                className="h-3.5 w-3.5 shrink-0 text-destructive"
                aria-label="Évaluation en attente"
              />
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {stagiaire.formation || "Formation non renseignée"}
            {stagiaire.universite ? ` · ${stagiaire.universite}` : ""}
          </p>
        </div>
      </div>

      <div className="mb-4 space-y-1.5 text-sm">
        <p className="font-medium text-foreground">{stagiaire.poste}</p>
        {stagiaire.secteurActivite && (
          <p className="text-xs text-muted-foreground">
            {stagiaire.secteurActivite}
          </p>
        )}
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <FiCalendar className="h-3.5 w-3.5" />
          {formatDate(stagiaire.dateDebut)} →{" "}
          {formatDate(stagiaire.dateFinPrevue)}
        </p>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUT_COLORS[stagiaire.statutStage]}`}
        >
          {STATUT_LABELS[stagiaire.statutStage]}
        </span>
        <span className="text-xs text-muted-foreground">
          {stagiaire.progression}%
        </span>
      </div>

      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
          style={{ width: `${stagiaire.progression}%` }}
        />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1.5 rounded-md bg-muted/60 px-2.5 py-1.5 text-foreground">
          <FiTarget className="h-3.5 w-3.5 text-primary" />
          Objectifs : {stagiaire.objectifsAtteints}/{stagiaire.objectifsTotal}
        </div>
        <div className="flex items-center gap-1.5 rounded-md bg-muted/60 px-2.5 py-1.5 text-foreground">
          <FiCheckSquare className="h-3.5 w-3.5 text-secondary" />
          Tâches : {stagiaire.tachesTerminees}/{stagiaire.tachesTotal}
        </div>
      </div>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <FiClock className="h-3.5 w-3.5" />
        {stagiaire.derniereActivite
          ? `Dernière évaluation le ${formatDate(stagiaire.derniereActivite)}`
          : "Aucune évaluation soumise"}
      </p>
    </Link>
  );
}
