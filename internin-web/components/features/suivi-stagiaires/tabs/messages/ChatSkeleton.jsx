"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

export default function ChatSkeleton() {
  const { t } = useTranslation();

  return (
    <div
      className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm"
      role="status"
      aria-label={t("suivi.msg.loadingAria")}
    >
      <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3">
        <div className="size-11 animate-pulse rounded-xl bg-muted/70" />
        <div className="space-y-2">
          <div className="h-4 w-32 animate-pulse rounded bg-muted/70" />
          <div className="h-3 w-48 animate-pulse rounded bg-muted/70" />
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div className="flex justify-start">
          <div className="h-12 w-48 animate-pulse rounded-2xl bg-muted/70" />
        </div>
        <div className="flex justify-end">
          <div className="h-10 w-36 animate-pulse rounded-2xl bg-muted/70" />
        </div>
        <div className="flex justify-start">
          <div className="h-14 w-56 animate-pulse rounded-2xl bg-muted/70" />
        </div>
      </div>
    </div>
  );
}
