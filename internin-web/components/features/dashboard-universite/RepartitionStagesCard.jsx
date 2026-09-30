"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
import { cn } from "@/lib/utils";

export default function RepartitionStagesCard({ repartition }) {
  const { t } = useTranslation();
  const { actif = 0, termine = 0, interrompu = 0 } = repartition || {};
  const total = actif + termine + interrompu;
  const denom = total || 1;

  const lignes = [
    {
      key: "actif",
      label: t("universiteSpace.dashboard.stagesInProgress"),
      value: actif,
      bar: "bg-teal-500",
      text: "text-teal-700 dark:text-teal-300",
    },
    {
      key: "termine",
      label: t("universiteSpace.dashboard.stagesCompleted"),
      value: termine,
      bar: "bg-[#5B3DF5]",
      text: "text-[#5B3DF5] dark:text-[#A78BFA]",
    },
    {
      key: "interrompu",
      label: t("universiteSpace.dashboard.stagesInterrupted"),
      value: interrompu,
      bar: "bg-destructive",
      text: "text-destructive",
    },
  ];

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border/80 bg-card p-5 shadow-sm sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {t("universiteSpace.dashboard.stagesLabel")}
      </p>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-4xl font-bold tabular-nums tracking-tight text-foreground">
          {actif}
        </span>
        <span className="text-sm text-muted-foreground">
          {t("universiteSpace.dashboard.stagesActiveNow")}
        </span>
      </div>

      <div className="mt-6 space-y-4">
        {lignes.map((ligne) => (
          <div key={ligne.key}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">{ligne.label}</span>
              <span className={cn("font-bold tabular-nums", ligne.text)}>
                {ligne.value}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all", ligne.bar)}
                style={{
                  width: `${Math.min(100, (ligne.value / denom) * 100)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {total === 0 && (
        <p className="mt-4 text-xs text-muted-foreground">
          {t("universiteSpace.dashboard.stagesEmpty")}
        </p>
      )}
    </div>
  );
}
