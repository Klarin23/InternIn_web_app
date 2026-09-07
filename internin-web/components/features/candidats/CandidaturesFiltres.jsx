"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
import { cn } from "@/lib/utils";

const BASE_TAB_DEFS = [
  { value: "tous", labelKey: "entrepriseSpace.candidatures.filterAll", countKey: "tous" },
  { value: "soumise", labelKey: "entrepriseSpace.candidatures.filterNew", countKey: "soumise" },
  { value: "consultee", labelKey: "entrepriseSpace.candidatures.filterInProgress", countKey: "consultee" },
  { value: "preselectionnee", labelKey: "entrepriseSpace.candidatures.filterInterview", countKey: "preselectionnee" },
  { value: "acceptee", labelKey: "entrepriseSpace.candidatures.filterAccepted", countKey: "acceptee" },
  { value: "rejetee", labelKey: "entrepriseSpace.candidatures.filterRejected", countKey: "rejetee" },
  { value: "retiree", labelKey: "entrepriseSpace.candidatures.filterWithdrawn", countKey: "retiree" },
];

/**
 * Filtres candidatures avec compteurs.
 * Le filtre "À traiter" n'apparaît que s'il y a des demandes en attente.
 */
export default function CandidaturesFiltres({
  value,
  onChange,
  nbATraiter = 0,
  compteurs = {},
}) {
  const { t } = useTranslation();

  const tabs = [
    ...BASE_TAB_DEFS.map((x) => ({ ...x, label: t(x.labelKey) })),
    ...(nbATraiter > 0
      ? [
          {
            value: "a_traiter",
            label: t("entrepriseSpace.candidatures.filterToHandle"),
            countKey: "a_traiter",
            countOverride: nbATraiter,
          },
        ]
      : []),
  ];

  return (
    <div
      className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-card p-1"
      role="tablist"
      aria-label={t("entrepriseSpace.candidatures.filterAria")}
    >
      {tabs.map((tab) => {
        const active = value === tab.value;
        const count =
          tab.countOverride ??
          compteurs[tab.countKey] ??
          compteurs[tab.value] ??
          null;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(tab.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-semibold transition",
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {tab.label}
            {count != null && count > 0 ? (
              <span className="ml-1.5 tabular-nums opacity-80">{count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
