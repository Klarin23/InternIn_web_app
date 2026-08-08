"use client";
// Regroupe candidatures + entretiens par mois sur les 6 derniers mois.
// Avec peu de données de test, la courbe sera plate/sparse — c'est normal,
// le calcul reste correct et se remplira naturellement avec l'usage réel.

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const MOIS_LABELS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

function buildMonthlySeries(candidatures, entretiens) {
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() });
  }

  return months.map(({ year, month }) => {
    const label = MOIS_LABELS[month];
    const candidaturesCount = candidatures.filter((c) => {
      const d = new Date(c.dateCandidature);
      return d.getFullYear() === year && d.getMonth() === month;
    }).length;
    const entretiensCount = entretiens.filter((e) => {
      const d = new Date(e.dateHeure);
      return d.getFullYear() === year && d.getMonth() === month;
    }).length;
    return { label, Candidatures: candidaturesCount, Entretiens: entretiensCount };
  });
}

export default function RecruitmentActivityChart({ candidatures, entretiens }) {
  const data = buildMonthlySeries(candidatures || [], entretiens || []);

  return (
    <div className="rounded-md border border-border bg-card p-5">
      <h5 className="mb-1 text-sm font-semibold text-foreground">Activité de recrutement</h5>
      <p className="mb-4 text-xs text-muted-foreground">Candidatures et entretiens sur 6 mois</p>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ left: -20 }}>
          <defs>
            <linearGradient id="colorCandidatures" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 13 }}
          />
          <Area type="monotone" dataKey="Candidatures" stroke="var(--primary)" fill="url(#colorCandidatures)" strokeWidth={2} />
          <Area type="monotone" dataKey="Entretiens" stroke="var(--secondary)" fill="transparent" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}