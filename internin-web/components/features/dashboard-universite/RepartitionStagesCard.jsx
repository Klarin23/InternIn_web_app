// Écart assumé vis-à-vis de la maquette : le schéma ne connaît que 3 statuts
// de stage réels (actif / terminé / interrompu) — pas de statut "refusé" ou
// "en attente" au niveau du stage lui-même (ça, c'est le statut de la
// convention qui le précède). On affiche donc ces 3 catégories réelles
// plutôt que les 4 de la maquette.
export default function RepartitionStagesCard({ repartition }) {
  const { actif = 0, termine = 0, interrompu = 0 } = repartition || {};
  const total = actif + termine + interrompu || 1;

  const lignes = [
    { label: "En cours", value: actif, color: "bg-primary" },
    { label: "Terminés", value: termine, color: "bg-success" },
    { label: "Interrompus", value: interrompu, color: "bg-destructive" },
  ];

  return (
    <div className="rounded-md border border-border bg-card p-5">
      <h3 className="mb-4 text-sm font-bold text-foreground">
        Statuts des stages
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