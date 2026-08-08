export default function OffresParStatutCard({ repartition }) {
  const { approuvees = 0, enAttente = 0, rejetees = 0 } = repartition || {};
  const total = approuvees + enAttente + rejetees || 1;

  const lignes = [
    { label: "Approuvées", value: approuvees, color: "bg-success" },
    { label: "En attente", value: enAttente, color: "bg-warning" },
    { label: "Rejetées", value: rejetees, color: "bg-destructive" },
  ];

  return (
    <div className="rounded-md border border-border bg-card p-5">
      <h3 className="mb-4 text-sm font-bold text-foreground">
        Offres par statut
      </h3>
      <div className="space-y-4">
        {lignes.map((ligne) => (
          <div key={ligne.label}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">{ligne.label}</span>
              <span className="font-bold text-foreground">{ligne.value}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${ligne.color}`}
                style={{ width: `${(ligne.value / total) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
