import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }) {
  return (
    <div className={cn("skeleton-shimmer rounded-sm", className)} {...props} />
  );
}
