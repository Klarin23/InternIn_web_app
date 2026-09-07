"use client";

import { cn } from "@/lib/utils";

export function SectionCard({ title, description, children, className, danger }) {
  return (
    <section
      className={cn(
        "rounded-2xl border bg-card shadow-sm",
        // overflow-hidden only if not explicitly visible (dropdowns need overflow)
        className?.includes("overflow-visible") ? "overflow-visible" : "overflow-hidden",
        danger ? "border-destructive/30" : "border-border/70",
        className,
      )}
    >
      {(title || description) && (
        <div
          className={cn(
            "border-b px-5 py-4",
            danger ? "border-destructive/20 bg-destructive/5" : "border-border/60",
          )}
        >
          {title && (
            <h2
              className={cn(
                "text-base font-semibold",
                danger ? "text-destructive" : "text-foreground",
              )}
            >
              {title}
            </h2>
          )}
          {description && (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function SettingRow({ title, description, children }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function InfoLine({ label, value }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex flex-col gap-0.5 border-b border-border/50 py-3 last:border-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm font-medium text-foreground sm:text-right">
        {value}
      </dd>
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Chargement des paramètres">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-36 animate-pulse rounded-2xl bg-muted/70"
          aria-hidden
        />
      ))}
    </div>
  );
}
