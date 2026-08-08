import { Skeleton } from "@/components/ui/skeleton";

export default function EntrepriseProfilSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-md border border-border bg-card p-6">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Skeleton className="h-20 w-20 flex-shrink-0 rounded-full" />
          <div className="flex-1 space-y-2.5">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-72" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-10 w-40 flex-shrink-0 rounded-sm" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Skeleton className="h-40 w-full rounded-md" />
          <Skeleton className="h-32 w-full rounded-md" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-56 w-full rounded-md" />
          <Skeleton className="h-32 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}
