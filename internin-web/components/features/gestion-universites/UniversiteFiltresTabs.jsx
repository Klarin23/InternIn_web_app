"use client";

import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/useTranslation";

const TABS = [
  { value: "tous", labelKey: "filterAll" },
  { value: "en_attente", labelKey: "filterPending" },
  { value: "verifiee", labelKey: "filterVerified" },
  { value: "rejetee", labelKey: "filterRejected" },
  { value: "suspendu", labelKey: "filterRestricted" },
];

export default function UniversiteFiltresTabs({ value, onChange, counts }) {
  const { t } = useTranslation();
  return (
    <div
      className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-card p-1"
      role="tablist"
      aria-label={t("adminUniversites.filterAriaLabel")}
    >
      {TABS.map((tab) => {
        const isActive = value === tab.value;
        const count = counts?.[tab.value] ?? 0;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              isActive
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {t(`adminUniversites.${tab.labelKey}`)}
            <span
              className={cn(
                "ml-1.5 tabular-nums",
                isActive ? "opacity-70" : "opacity-50",
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
