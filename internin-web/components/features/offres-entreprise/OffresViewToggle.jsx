"use client";

import { FiGrid, FiList } from "react-icons/fi";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function OffresViewToggle({ vue, onChange }) {
  const { t } = useTranslation();

  return (
    <div
      className="flex items-center gap-0.5 rounded-lg border border-border bg-background p-0.5"
      role="group"
      aria-label={t("entrepriseSpace.offers.viewToggle")}
    >
      <button
        type="button"
        onClick={() => onChange("grille")}
        title={t("entrepriseSpace.offers.gridView")}
        aria-pressed={vue === "grille"}
        className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
          vue === "grille"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        <FiGrid className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange("liste")}
        title={t("entrepriseSpace.offers.listView")}
        aria-pressed={vue === "liste"}
        className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
          vue === "liste"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        <FiList className="h-4 w-4" />
      </button>
    </div>
  );
}
