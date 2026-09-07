"use client";

import { useMemo } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";

const TAB_DEFS = [
  { value: "tous", labelKey: "suivi.filterAll" },
  { value: "en_cours", labelKey: "suivi.filterOngoing" },
  { value: "fin_proche", labelKey: "suivi.filterEndingSoon" },
  { value: "alerte", labelKey: "suivi.filterAlert" },
  { value: "termine", labelKey: "suivi.filterCompleted" },
];

export default function StagiaireFiltresTabs({ value, onChange, counts }) {
  const { t } = useTranslation();
  const TABS = useMemo(
    () => TAB_DEFS.map((tab) => ({ ...tab, label: t(tab.labelKey) })),
    [t],
  );

  return (
    <div className="flex flex-wrap gap-2">
      {TABS.map((tab) => {
        const isActive = value === tab.value;
        const count = counts[tab.value] ?? 0;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
          >
            {tab.label}
            {tab.value !== "tous" && count > 0 ? (
              <span className="ml-1.5 opacity-80">({count})</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
