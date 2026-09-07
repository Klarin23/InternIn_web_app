export default function PropositionsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="h-[220px] animate-pulse rounded-2xl border border-border bg-muted/50 p-5"
        >
          <div className="mb-4 h-5 w-20 rounded-full bg-muted" />
          <div className="mb-3 flex gap-3">
            <div className="h-11 w-11 rounded-xl bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-muted" />
              <div className="h-3 w-24 rounded bg-muted" />
            </div>
          </div>
          <div className="mb-3 h-5 w-3/4 rounded bg-muted" />
          <div className="mb-4 flex gap-2">
            <div className="h-3 w-16 rounded bg-muted" />
            <div className="h-3 w-14 rounded bg-muted" />
          </div>
          <div className="h-3 w-full rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}
