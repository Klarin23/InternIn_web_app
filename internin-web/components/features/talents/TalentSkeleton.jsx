"use client";

function Block({ className }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-muted/70 ${className || ""}`}
      aria-hidden
    />
  );
}

export function TalentCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
      <div className="flex gap-3">
        <Block className="size-14 rounded-full" />
        <div className="flex-1 space-y-2">
          <Block className="h-4 w-32" />
          <Block className="h-3 w-40" />
          <Block className="h-3 w-24" />
        </div>
      </div>
      <Block className="mt-4 h-2 w-full rounded-full" />
      <div className="mt-4 flex gap-2">
        <Block className="h-8 flex-1" />
        <Block className="h-8 flex-1" />
      </div>
    </div>
  );
}

export function TalentGridSkeleton({ count = 8 }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <TalentCardSkeleton key={i} />
      ))}
    </div>
  );
}
