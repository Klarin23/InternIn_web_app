"use client";
// Carte fantôme affichée pendant le chargement des offres. Reprend
// exactement la structure de OffreCard (logo, titre, entreprise,
// localisation, badges, rémunération, bouton) pour éviter tout saut de
// mise en page une fois les vraies cartes chargées.

import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

export default function OffreCardSkeleton({ vue = "grille", index = 0 }) {
  const estListe = vue === "liste";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.3) }}
      className={`rounded-md border border-border bg-card ${
        estListe ? "flex items-center gap-4 p-4" : "p-5"
      }`}
    >
      <div className={`flex items-start gap-3 ${estListe ? "flex-1" : "mb-3"}`}>
        <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        {estListe && <Skeleton className="hidden h-4 w-20 sm:block" />}
      </div>

      {!estListe && (
        <>
          <div className="mb-3 flex flex-wrap gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <div className="mb-4 flex flex-wrap gap-1.5">
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-10" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        </>
      )}
    </motion.div>
  );
}
