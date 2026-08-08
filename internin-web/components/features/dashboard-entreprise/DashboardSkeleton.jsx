import { Skeleton } from "@/components/ui/skeleton";

function StatCardSkeleton() {
  return (
    <div className="flex h-full flex-col rounded-md border border-border bg-card p-5">
      <Skeleton className="mb-4 h-10 w-10 rounded-sm" />
      <Skeleton className="h-7 w-16" />
      <Skeleton className="mt-2 h-4 w-24" />
      <Skeleton className="mt-1.5 h-3 w-20" />
    </div>
  );
}

function ChartCardSkeleton({ className }) {
  return (
    <div className={`rounded-md border border-border bg-card p-5 ${className}`}>
      <Skeleton className="mb-4 h-4 w-40" />
      <Skeleton className="h-48 w-full rounded-md" />
    </div>
  );
}

function ListCardSkeleton() {
  return (
    <div className="rounded-md border border-border bg-card p-5">
      <Skeleton className="mb-4 h-4 w-32" />
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 flex-shrink-0 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-3/5" />
              <Skeleton className="h-3 w-2/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-24 w-full rounded-md" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ListCardSkeleton />
        <ListCardSkeleton />
      </div>
    </div>
  );
}
