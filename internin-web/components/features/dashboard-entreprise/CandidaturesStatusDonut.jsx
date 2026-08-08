"use client";
// Ordre des couleurs conforme à la Charte Graphique §16 :
// Turquoise -> Violet -> Jaune -> Bleu -> Vert

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const STATUT_CONFIG = [
  { key: "soumise", label: "Soumise", color: "#14B8A6" },
  { key: "consultee", label: "Consultée", color: "#5B3DF5" },
  { key: "preselectionnee", label: "Présélectionnée", color: "#F7B500" },
  { key: "acceptee", label: "Acceptée", color: "#3B82F6" },
  { key: "rejetee", label: "Rejetée", color: "#22C55E" },
];

export default function CandidaturesStatusDonut({ candidatures }) {
  const data = STATUT_CONFIG.map((s) => ({
    ...s,
    value: (candidatures || []).filter((c) => c.statut === s.key).length,
  })).filter((d) => d.value > 0);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="rounded-md border border-border bg-card p-5">
      <h5 className="mb-1 text-sm font-semibold text-foreground">Statut des candidatures</h5>
      <p className="mb-4 text-xs text-muted-foreground">Répartition actuelle</p>

      {total === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Aucune candidature pour l&apos;instant</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={data} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={2}>
                {data.map((d) => (
                  <Cell key={d.key} fill={d.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {data.map((d) => (
              <div key={d.key} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  {d.label}
                </span>
                <span className="font-semibold text-foreground">{d.value}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}