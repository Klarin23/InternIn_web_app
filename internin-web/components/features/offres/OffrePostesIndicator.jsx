"use client";

import { FiUsers, FiCheckCircle } from "react-icons/fi";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function OffrePostesIndicator({ offre, compact = false }) {
  const { t } = useTranslation();
  const total = Math.max(0, Number(offre?.nombrePostes ?? 0));
  const occupees = Math.min(total, Math.max(0, Number(offre?.nombreCandidaturesActives ?? 0)));
  if (!total) return null;
  const complet = occupees >= total;
  const pct = Math.min(100, Math.round((occupees / total) * 100));

  return (
    <div className={compact ? "min-w-[130px]" : "rounded-md border border-border bg-muted/30 p-3.5"}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          {complet ? <FiCheckCircle className="h-3.5 w-3.5" /> : <FiUsers className="h-3.5 w-3.5" />}
          <span>{complet ? t("offersPage.positions.full") : t("offersPage.positions.label")}</span>
        </div>
        <span className={`text-sm font-bold ${complet ? "text-destructive" : "text-foreground"}`}>
          {occupees}/{total}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <div className={`h-full rounded-full transition-all duration-500 ${complet ? "bg-destructive" : "bg-primary"}`} style={{ width: `${pct}%` }} />
      </div>
      <p className={`mt-1.5 text-[11px] font-medium ${complet ? "text-destructive" : "text-muted-foreground"}`}>
        {complet ? t("offersPage.positions.fullHint") : t("offersPage.positions.remaining", { n: total - occupees })}
      </p>
    </div>
  );
}
