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
          type="search"
          value={recherche}
          onChange={(e) => onRechercheChange(e.target.value)}
          placeholder={t("interviews.filters.searchPlaceholder") || "Rechercher un candidat..."}
          aria-label={t("interviews.filters.searchPlaceholder") || "Rechercher un candidat"}
          className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm text-foreground outline-none transition-all duration-200 placeholder:text-muted-foreground focus:border-primary focus:shadow-[0_0_0_3px_rgba(20,184,166,0.15)]"
        />
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-0.5 sm:flex-wrap sm:overflow-visible" role="group" aria-label="Filtres">
        {FILTRES_ENTRETIEN.map((f) => {
          const actif = filtreActif === f.valeur;
          return (
            <button
              key={f.valeur}
              type="button"
              onClick={() => onFiltreChange(f.valeur)}
              aria-pressed={actif}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.97] ${
                actif
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              {t(f.labelKey)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
