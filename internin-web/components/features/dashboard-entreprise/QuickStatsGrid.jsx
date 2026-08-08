import { FiBriefcase, FiUsers, FiUserCheck } from "react-icons/fi";

export default function QuickStatsGrid({ offres }) {
  const offresPubliees = offres.filter((o) => o.statut === "publie").length;
  const totalCandidatures = offres.reduce(
    (sum, o) => sum + o.nombreCandidatures,
    0,
  );
  const postesOuverts = offres
    .filter((o) => o.statut === "publie")
    .reduce((sum, o) => sum + o.nombrePostes, 0);

  const stats = [
    {
      icon: FiBriefcase,
      label: "Offres publiées",
      value: offresPubliees,
      color: "bg-secondary/10 text-secondary",
    },
    {
      icon: FiUsers,
      label: "Candidatures reçues",
      value: totalCandidatures,
      color: "bg-primary/10 text-primary",
    },
    {
      icon: FiUserCheck,
      label: "Postes ouverts",
      value: postesOuverts,
      color: "bg-accent/40 text-amber-700",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map(({ icon: Icon, label, value, color }) => (
        <div
          key={label}
          className="rounded-md border border-border bg-card p-5"
        >
          <div
            className={`mb-3 flex h-10 w-10 items-center justify-center rounded-sm ${color}`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="text-xl font-bold text-foreground">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      ))}
    </div>
  );
}
