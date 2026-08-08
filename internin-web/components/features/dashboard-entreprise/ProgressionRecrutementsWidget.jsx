"use client";

import Link from "next/link";
import { FiTarget } from "react-icons/fi";

export default function ProgressionRecrutementsWidget({
  offres,
  candidatures,
}) {
  const liste = (offres || [])
    .filter((o) => o.statut === "publie" && o.nombrePostes > 0)
    .map((o) => {
      const selectionnes = (candidatures || []).filter(
        (c) => c.idOffre === o.idOffre && c.statut === "acceptee",
      ).length;
      const pourcentage = Math.min(
        100,
        Math.round((selectionnes / o.nombrePostes) * 100),
      );
      return { ...o, selectionnes, pourcentage };
    })
    .sort((a, b) => b.pourcentage - a.pourcentage)
    .slice(0, 5);

  return (
    <div className="rounded-md border border-border bg-card bg-linear-to-br from-primary/[0.04] via-transparent to-transparent p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <FiTarget className="h-4.5 w-4.5" />
        </div>
        <h5 className="text-sm font-semibold text-foreground">
          Progression des recrutements
        </h5>
      </div>

      {liste.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Aucune offre active en cours de recrutement
        </p>
      ) : (
        <div className="space-y-4">
          {liste.map((o) => (
            <div key={o.idOffre}>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-foreground">
                  {o.titre}
                </span>
                <span className="flex-shrink-0 text-xs font-semibold text-muted-foreground">
                  {o.pourcentage}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary transition-all duration-700 ease-out"
                  style={{ width: `${o.pourcentage}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {o.selectionnes}/{o.nombrePostes} candidats sélectionnés
              </p>
            </div>
          ))}
        </div>
      )}

      <Link
        href="/offres-entreprise"
        className="mt-4 block text-center text-xs font-semibold text-primary hover:underline"
      >
        Voir toutes les offres
      </Link>
    </div>
  );
}
