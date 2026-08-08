"use client";
// Graphique "Évolution des candidatures" — nombre de candidatures envoyées
// par mois sur les 6 derniers mois (pas de notion "d'objectif" dans le
// schéma actuel, donc pas de jauge circulaire fictive : juste les vraies
// données, en barres).

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useMesCandidatures } from "@/lib/queries/useMesCandidatures";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function EvolutionCandidaturesCard() {
  const { t } = useTranslation();
  const { data: candidatures } = useMesCandidatures();
  const moisLabel = t("dashboard.evolutionCard.months");

  const donnees = useMemo(() => {
    const maintenant = new Date();
    const mois = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(
        maintenant.getFullYear(),
        maintenant.getMonth() - (5 - i),
        1,
      );
      return {
        annee: d.getFullYear(),
        mois: d.getMonth(),
        label: moisLabel[d.getMonth()],
      };
    });

    return mois.map((m) => ({
      label: m.label,
      total:
        candidatures?.filter((c) => {
          const d = new Date(c.dateCandidature);
          return d.getFullYear() === m.annee && d.getMonth() === m.mois;
        }).length ?? 0,
    }));
  }, [candidatures, moisLabel]);

  const total = donnees.reduce((s, m) => s + m.total, 0);

  return (
    <div className="rounded-[20px] border border-border bg-card p-6 shadow-[0_2px_10px_-4px_rgba(17,24,39,0.08)] transition-shadow hover:shadow-[0_8px_24px_-6px_rgba(17,24,39,0.12)]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">
          {t("dashboard.evolutionCard.title")}
        </h3>
        <span className="text-xs text-muted-foreground">
          {t("dashboard.evolutionCard.totalOverMonths", { total })}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart
          data={donnees}
          margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
        >
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            fontSize={12}
            stroke="currentColor"
            className="text-muted-foreground"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            fontSize={12}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(20,184,166,0.08)" }}
            contentStyle={{
              borderRadius: 8,
              fontSize: 12,
              border: "1px solid #e5e7eb",
            }}
          />
          <Bar
            dataKey="total"
            fill="#14b8a6"
            radius={[4, 4, 0, 0]}
            name={t("dashboard.evolutionCard.seriesName")}
            isAnimationActive
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
