"use client";

import Link from "next/link";
import { FiBriefcase, FiMapPin, FiEdit2, FiUsers } from "react-icons/fi";
import OffreBadgesInfo from "./OffreBadgesInfo";
import CandidatsRecentsAvatars from "./CandidatsRecentsAvatars";

const STATUT_LABELS = { brouillon: "Brouillon", publie: "Active", pause: "En pause", ferme: "Fermée", archive: "Archivée", expire: "Expirée" };
const STATUT_COLORS = {
  brouillon: "bg-accent/40 text-amber-700",
  publie: "bg-success/10 text-green-700",
  pause: "bg-accent/40 text-amber-700",
  ferme: "bg-destructive/10 text-destructive",
  archive: "bg-muted text-muted-foreground",
  expire: "bg-destructive/10 text-destructive",
};
const MODE_LABELS = { distance: "Distance", hybride: "Hybride", presentiel: "Présentiel" };

function estExpiree(offre) {
  return offre.statut === "publie" && offre.dateLimiteCandidature && new Date(offre.dateLimiteCandidature) < new Date();
}

export default function OffreListRow({ offre, candidatsRecents = [], seuilPopulaire = 10, onEdit }) {
  const statutAffiche = estExpiree(offre) ? "expire" : offre.statut;
  const pourcentage = offre.nombrePostes
    ? Math.min(100, Math.round((offre.nombreAcceptes / offre.nombrePostes) * 100))
    : 0;

  return (
    <div className="flex flex-col gap-4 rounded-md border border-border bg-card p-4 sm:flex-row sm:items-center">
      {offre.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={offre.logoUrl} alt="" className="h-11 w-11 flex-shrink-0 rounded-sm border border-border object-cover" />
      ) : (
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-sm bg-primary/10 text-primary">
          <FiBriefcase className="h-5 w-5" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <h5 className="truncate font-semibold text-foreground">{offre.titre}</h5>
          <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUT_COLORS[statutAffiche]}`}>
            {STATUT_LABELS[statutAffiche]}
          </span>
        </div>
        <p className="mb-1.5 truncate text-xs text-muted-foreground">
          {offre.departement || offre.secteurActivite} ·{" "}
          <FiMapPin className="mb-0.5 inline h-3 w-3" /> {offre.ville || "Non précisé"} ·{" "}
          {MODE_LABELS[offre.modeTravail]}
        </p>
        <CandidatsRecentsAvatars candidats={candidatsRecents} />
      </div>

      <div className="flex flex-shrink-0 items-center gap-6">
        <div className="hidden text-center sm:block">
          <div className="text-sm font-bold text-foreground">{offre.nombreCandidatures}</div>
          <div className="text-[10px] text-muted-foreground">Candidatures</div>
        </div>
        <div className="hidden w-28 md:block">
          <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
            <span>Recrutement</span>
            <span className="font-semibold">{pourcentage}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary" style={{ width: `${pourcentage}%` }} />
          </div>
        </div>

        <OffreBadgesInfo offre={offre} seuilPopulaire={seuilPopulaire} />

        <div className="flex items-center gap-1">
          <Link
            href={`/candidats?idOffre=${offre.idOffre}`}
            className="flex h-8 w-8 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Voir les candidats"
          >
            <FiUsers className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => onEdit(offre.idOffre)}
            className="flex h-8 w-8 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Modifier"
          >
            <FiEdit2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}