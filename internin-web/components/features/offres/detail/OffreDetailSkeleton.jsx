"use client";
// Skeleton de chargement — reproduit la structure réelle de la page
// (hero, sections principales, sidebar) pour éviter tout saut de mise en
// page une fois les données chargées. Le shimmer vient du composant
// Skeleton existant (components/ui/skeleton.jsx).

import { Skeleton } from "@/components/ui/skeleton";

export default function OffreDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="rounded-md border border-border bg-card p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <Skeleton className="h-16 w-16 shrink-0 rounded-full sm:h-[72px] sm:w-[72px]" />
          <div className="flex-1 space-y-2.5">
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-7 w-28 rounded-full" />
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-14" />
        </div>
      </div>

      {/* Deux colonnes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-md border border-border bg-card p-6 sm:p-7">
            <Skeleton className="mb-3 h-4 w-40" />
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-2/3" />
            </div>
          </div>
          <div className="rounded-md border border-border bg-card p-6 sm:p-7">
            <Skeleton className="mb-4 h-4 w-40" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 shrink-0 rounded-sm" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3.5 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-md border border-border bg-card p-6 sm:p-7">
            <Skeleton className="mb-3 h-4 w-32" />
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-5/6" />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-md border border-border bg-card p-5">
            <Skeleton className="mb-3 h-4 w-32" />
            <Skeleton className="mb-4 h-16 w-full rounded-sm" />
            <div className="space-y-2.5">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-full" />
            </div>
          </div>
          <div className="rounded-md border border-border bg-card p-5">
            <Skeleton className="mb-3 h-4 w-24" />
            <Skeleton className="h-12 w-full rounded-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
