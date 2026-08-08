"use client";

import Link from "next/link";
import { FiStar } from "react-icons/fi";
import { useCandidatsRecommandes } from "@/lib/queries/useCandidaturesEntreprise";

export default function CandidatsRecommandesWidget() {
  const { data: recommandes, isLoading } = useCandidatsRecommandes();

  return (
    <div className="rounded-md border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary/20 to-primary/5 text-primary">
          <FiStar className="h-4.5 w-4.5" />
        </div>
        <div>
          <h5 className="text-sm font-semibold text-foreground">
            Candidats recommandés
          </h5>
          <p className="text-xs text-muted-foreground">
            Selon les compétences requises de vos offres
          </p>
        </div>
      </div>

      {isLoading ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Chargement...
        </p>
      ) : !recommandes || recommandes.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Aucune recommandation pour le moment
        </p>
      ) : (
        <div className="space-y-3">
          {recommandes.map((c) => (
            <div
              key={c.idCandidature}
              className="flex items-center gap-3 rounded-md border border-border/60 bg-muted/20 p-3"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {c.photoProfilUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.photoProfilUrl}
                    alt={`${c.prenom} ${c.nom}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  `${c.prenom?.[0] || ""}${c.nom?.[0] || ""}`
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {c.prenom} {c.nom}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {c.titreOffre}
                </p>
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-bold text-green-700">
                  <FiStar className="h-3 w-3 fill-current" />
                  Correspondance {c.scoreCorrespondance}%
                </span>
              </div>

              <Link
                href={`/candidats?idOffre=${c.idOffre}`}
                className="flex-shrink-0 rounded-sm border border-primary/30 px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10"
              >
                Voir le profil
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
