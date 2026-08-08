"use client";
// Skeleton affiché pendant le chargement du profil (remplace le simple
// spinner plein écran). Reproduit la structure réelle de la page : Hero
// (photo + infos + barre de progression) puis les cartes de section, pour
// éviter tout saut de mise en page une fois les données chargées.

import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

function SectionSkeleton({ delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay }}
      className="rounded-md border border-border bg-card p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-6 w-20 rounded-sm" />
      </div>
      <div className="space-y-2.5">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-4/5" />
        <Skeleton className="h-3.5 w-3/5" />
      </div>
    </motion.div>
  );
}

export default function ProfilSkeleton() {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="overflow-hidden rounded-md border border-border bg-card">
        <div className="flex flex-col items-center gap-5 p-5 sm:flex-row sm:p-6">
          <Skeleton className="h-24 w-24 flex-shrink-0 rounded-full sm:h-28 sm:w-28" />
          <div className="w-full min-w-0 flex-1 space-y-2.5 text-center sm:text-left">
            <Skeleton className="mx-auto h-6 w-48 sm:mx-0" />
            <Skeleton className="mx-auto h-4 w-36 sm:mx-0" />
            <Skeleton className="mx-auto h-3.5 w-44 sm:mx-0" />
          </div>
        </div>
        <div className="border-t border-border/60 bg-muted/30 px-5 py-4 sm:px-6">
          <Skeleton className="mb-2 h-3.5 w-28" />
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>
      </div>

      {/* Sections */}
      {Array.from({ length: 6 }).map((_, i) => (
        <SectionSkeleton key={i} delay={i * 0.05} />
      ))}
    </div>
  );
}
