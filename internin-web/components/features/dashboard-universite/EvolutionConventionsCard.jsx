"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

function formatMoisLabel(mois, locale) {
  if (!mois || typeof mois !== "string") return mois;
  const [y, m] = mois.split("-");
  if (!y || !m) return mois;
  try {
    const d = new Date(Number(y), Number(m) - 1, 1);
    return d.toLocaleDateString(locale === "en" ? "en-GB" : "fr-FR", {
      month: "short",
      year: "2-digit",
    });
  } catch {
    return mois;
  }
}

export default function EvolutionConventionsCard({ depotsParMois }) {
  const { t, locale } = useTranslation();
  const data = Array.isArray(depotsParMois) ? depotsParMois : [];
  const max = Math.max(1, ...data.map((d) => Number(d.count) || 0));
  const total = data.reduce((s, d) => s + (Number(d.count) || 0), 0);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border/80 bg-card p-5 shadow-sm sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {t("universiteSpace.dashboard.evolutionLabel")}
      </p>
      <h3 className="mt-1 text-base font-semibold text-foreground">
        {t("universiteSpace.dashboard.evolutionTitle")}
      </h3>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {t("universiteSpace.dashboard.evolutionHint", { count: total })}
      </p>

      {data.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          {t("universiteSpace.dashboard.evolutionEmpty")}
        </p>
      ) : (
        <div className="mt-6 flex flex-1 items-end gap-2 sm:gap-3">
          {data.map((d) => {
            const count = Number(d.count) || 0;
            const h = Math.max(4, (count / max) * 100);
            return (
              <div
                key={d.mois}
                className="flex min-w-0 flex-1 flex-col items-center gap-2"
              >
                <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">
                  {count > 0 ? count : ""}
                </span>
                <div className="flex h-28 w-full items-end">
                  <div
                    className="w-full rounded-t-md bg-teal-500/80 transition-all dark:bg-teal-400/70"
                    style={{ height: `${h}%` }}
                    title={`${count}`}
                  />
                </div>
                <span className="truncate text-[10px] capitalize text-muted-foreground">
                  {formatMoisLabel(d.mois, locale)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
