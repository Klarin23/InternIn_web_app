"use client";

import Link from "next/link";
import { FiArrowLeft, FiMail, FiPhone } from "react-icons/fi";

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

export default function DetailStagiaireHeader({ stagiaire, stage }) {
  const initiales =
    `${stagiaire.prenom?.charAt(0) || ""}${stagiaire.nom?.charAt(0) || ""}`.toUpperCase();

  return (
    <div>
      <Link
        href="/mes-stagiaires"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <FiArrowLeft className="h-4 w-4" />
        Mes stagiaires
      </Link>

      <div className="flex flex-wrap items-center gap-4">
        {stagiaire.photoProfilUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={stagiaire.photoProfilUrl}
            alt={`${stagiaire.prenom} ${stagiaire.nom}`}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
            {initiales}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-bold text-foreground">
              {stagiaire.prenom} {stagiaire.nom}
            </h1>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUT_COLORS[stage.statut]}`}
            >
              {STATUT_LABELS[stage.statut]}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
            {stagiaire.email && (
              <span className="flex items-center gap-1.5">
                <FiMail className="h-3.5 w-3.5" />
                {stagiaire.email}
              </span>
            )}
            {stagiaire.telephone && (
              <span className="flex items-center gap-1.5">
                <FiPhone className="h-3.5 w-3.5" />
                {stagiaire.telephone}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
