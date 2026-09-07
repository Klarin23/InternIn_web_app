"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
import { cn } from "@/lib/utils";
import { toneOf } from "./adminDashTheme";

export default function OffresParStatutCard({ repartition }) {
  const { t } = useTranslation();
  const { approuvees = 0, enAttente = 0, rejetees = 0 } = repartition || {};
  const total = approuvees + enAttente + rejetees;
  const denom = total || 1;

  const lignes = [
    { label: t("adminDashboard.approved"), value: approuvees, tone: "green" },
    { label: t("adminDashboard.pending"), value: enAttente, tone: "amber" },
    { label: t("adminDashboard.rejected"), value: rejetees, tone: "red" },
  ];

  return (
    <section className="rounded-xl border border-border/80 bg-card px-5 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {t("adminDashboard.offerPipeline")}
        </p>
        <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[11px] font-medium tabular-nums text-indigo-700 dark:text-indigo-300">
          {t("adminDashboard.total", { n: total })}
        </span>
      </div>
      {total === 0 ? (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("adminDashboard.noFinalOffers")}
        </p>
      ) : (
        <div className="mt-4 space-y-3.5">
          {lignes.map((ligne) => {
            const tone = toneOf(ligne.tone);
            return (
              <div key={ligne.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span
                      className={cn("h-1.5 w-1.5 rounded-full", tone.dot)}
                      aria-hidden
                    />
                    {ligne.label}
                  </span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {ligne.value}
                    <span className="ml-1 text-[11px] font-normal text-muted-foreground">
                      {Math.round((ligne.value / denom) * 100)}%
                    </span>
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/80">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      tone.bar,
                    )}
                    style={{ width: `${(ligne.value / denom) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
