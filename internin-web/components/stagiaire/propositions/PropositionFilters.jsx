"use client";

import { motion, useReducedMotion } from "framer-motion";
import { FILTERS } from "./propositionUtils";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function PropositionFilters({ filter, onChange, counts = {} }) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();

  return (
    <div
      role="tablist"
      aria-label={t("stagiaireSpace.propositions.filterAria")}
      className="flex flex-wrap gap-1.5 rounded-xl border border-border bg-card p-1.5"
    >
      {FILTERS.map((f) => {
        const active = filter === f.id;
        const count = counts[f.id];
        return (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(f.id)}
            className={cn(
              "relative rounded-lg px-3 py-1.5 text-sm font-medium transition",
              active
                ? "text-primary-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId={reduce ? undefined : "prop-filter-pill"}
                className="absolute inset-0 rounded-lg bg-primary"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10">
              {t(f.labelKey)}
              {typeof count === "number" && count > 0 ? (
                <span className="ml-1.5 tabular-nums opacity-80">({count})</span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
