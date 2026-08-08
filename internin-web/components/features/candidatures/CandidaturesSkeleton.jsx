"use client";
// Skeleton de chargement reproduisant la forme des cartes de candidature
// (logo, titre, entreprise, badge, timeline, boutons), avec un léger shimmer.

function Bloc({ className }) {
  return (
    <div
      className={`animate-pulse rounded-sm bg-muted ${className}`}
      style={{ animationDuration: "1.4s" }}
    />
  );
}

function CarteSkeleton() {
  return (
    <div className="rounded-md border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <Bloc className="h-11 w-11 flex-shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Bloc className="h-3.5 w-2/3" />
          <Bloc className="h-3 w-1/3" />
          <div className="flex gap-2">
            <Bloc className="h-3 w-16" />
            <Bloc className="h-3 w-14" />
          </div>
        </div>
      </div>

      <Bloc className="mt-3 h-6 w-24 rounded-full" />

      <div className="mt-4 flex items-center gap-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Bloc key={i} className="h-4 w-4 rounded-full" />
        ))}
      </div>

      <Bloc className="mt-3 h-3 w-40" />

      <div className="mt-4 flex gap-2">
        <Bloc className="h-8 flex-1 rounded-sm" />
        <Bloc className="h-8 flex-1 rounded-sm" />
      </div>
    </div>
  );
}

export default function CandidaturesSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CarteSkeleton key={i} />
      ))}
    </div>
  );
}
