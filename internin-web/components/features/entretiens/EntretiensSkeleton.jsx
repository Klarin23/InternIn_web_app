"use client";
// Skeleton de chargement pour la page entretiens : statistiques, prochain
// entretien, cartes, historique — avec un léger shimmer.

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
      <Bloc className="mb-3 h-5 w-24 rounded-full" />
      <Bloc className="h-3.5 w-2/3" />
      <Bloc className="mt-2 h-3 w-1/3" />
      <div className="mt-4 flex gap-4">
        <Bloc className="h-3 w-20" />
        <Bloc className="h-3 w-16" />
      </div>
      <div className="mt-4 flex gap-2">
        <Bloc className="h-8 flex-1 rounded-sm" />
        <Bloc className="h-8 flex-1 rounded-sm" />
      </div>
    </div>
  );
}

export default function EntretiensSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Bloc className="h-7 w-48" />
        <Bloc className="mt-2 h-4 w-72" />
        <div className="mt-4 grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Bloc key={i} className="h-20 rounded-md" />
          ))}
        </div>
      </div>

      <Bloc className="h-52 rounded-md" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <CarteSkeleton key={i} />
        ))}
      </div>

      <div className="space-y-2">
        <Bloc className="h-4 w-40" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Bloc key={i} className="h-14 rounded-md" />
        ))}
      </div>
    </div>
  );
}
