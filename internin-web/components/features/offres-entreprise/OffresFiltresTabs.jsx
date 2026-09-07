"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

export default function OffresFiltresTabs({ value, onChange }) {
  const { t } = useTranslation();
  const TABS = [
    { value: "tous", label: t("entrepriseSpace.offers.filterAll") },
    { value: "publie", label: t("entrepriseSpace.offers.filterActive") },
    { value: "ferme", label: t("entrepriseSpace.offers.filterClosed") },
    { value: "brouillon", label: t("entrepriseSpace.offers.filterDraft") },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {TABS.map((tab) => {
        const isActive = value === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
