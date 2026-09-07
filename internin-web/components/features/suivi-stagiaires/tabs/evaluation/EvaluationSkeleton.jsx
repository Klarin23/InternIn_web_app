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

export default function EvaluationSkeleton() {
  const { t } = useTranslation();

  return (
    <div
      className="space-y-6"
      role="status"
      aria-label={t("suivi.eval.loadingAria")}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Block className="h-6 w-48" />
          <Block className="h-4 w-72 max-w-full" />
        </div>
        <Block className="h-9 w-44" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Block key={i} className="h-24" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <Block className="h-64 lg:col-span-3" />
        <Block className="h-64 lg:col-span-2" />
      </div>
      <Block className="h-48" />
    </div>
  );
}
