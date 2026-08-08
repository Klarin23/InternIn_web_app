"use client";
// Nouveau graphique dédié aux 30 derniers jours (distinct de
// RecruitmentActivityChart qui reste sur une vue 6 mois/mensuelle — les deux
// peuvent coexister, ou tu peux retirer l'ancien du dashboard si tu préfères
// n'en garder qu'un). Une entrée par jour, y compris les jours à 0.

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function buildDailySeries(candidatures) {
  const days = [];
  const now = new Date();

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    days.push(d);
  }

  return days.map((d) => {
    const count = (candidatures || []).filter((c) => {
      const cd = new Date(c.dateCandidature);
      return (
        cd.getFullYear() === d.getFullYear() &&
        cd.getMonth() === d.getMonth() &&
        cd.getDate() === d.getDate()
      );
    }).length;

    return {
      label: d.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
      }),
      Candidatures: count,
    };
  });
}

export default function CandidaturesLast30JoursChart({ candidatures }) {
  const data = buildDailySeries(candidatures);

  return (
    <div className="rounded-md border border-border bg-card p-5">
      <h5 className="mb-1 text-sm font-semibold text-foreground">
        Candidatures reçues
      </h5>
      <p className="mb-4 text-xs text-muted-foreground">30 derniers jours</p>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ left: -20 }}>
          <defs>
            <linearGradient
              id="colorCandidatures30j"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            stroke="var(--muted-foreground)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            interval={4}
          />
          <YAxis
            stroke="var(--muted-foreground)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid var(--border)",
              fontSize: 13,
            }}
          />
          <Area
            type="monotone"
            dataKey="Candidatures"
            stroke="var(--primary)"
            fill="url(#colorCandidatures30j)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
