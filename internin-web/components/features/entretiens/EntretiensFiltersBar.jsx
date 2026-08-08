"use client";
// Barre de recherche + filtres par statut pour les entretiens, avec
// animation de focus sur la recherche et mise en évidence du filtre actif.

import { FiSearch } from "react-icons/fi";
import { FILTRES_ENTRETIEN } from "@/lib/entretiens/statut";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function EntretiensFiltersBar({
  recherche,
  onRechercheChange,
  filtreActif,
  onFiltreChange,
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-xs">
        <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={recherche}
          onChange={(e) => onRechercheChange(e.target.value)}
          placeholder={t("interviews.filters.searchPlaceholder")}
          className="w-full rounded-sm border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none transition-all duration-200 focus:border-[#14b8a6] focus:shadow-[0_0_0_3px_rgba(20,184,166,0.15)]"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {FILTRES_ENTRETIEN.map((f) => (
          <button
            key={f.valeur}
            type="button"
            onClick={() => onFiltreChange(f.valeur)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors active:scale-95 ${
              filtreActif === f.valeur
                ? "bg-[#14b8a6] text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {t(f.labelKey)}
          </button>
        ))}
      </div>
    </div>
  );
}
