"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

function Block({ className }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-muted/70 ${className || ""}`}
      aria-hidden
    />
  );
}

export default function OverviewSkeleton() {
  const { t } = useTranslation();
  return (
    <div
      className="space-y-5"
      role="status"
      aria-label={t("suivi.overview.loadingAria")}
    >
      <Block className="h-28" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Block key={i} className="h-24" />
        ))}
      </div>
      <Block className="h-32" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Block className="h-48" />
        <Block className="h-48" />
      </div>
      <Block className="h-40" />
    </div>
  );
}
