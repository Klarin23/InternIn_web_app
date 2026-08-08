// Écart assumé vis-à-vis de la maquette : il n'existe pas de date
// d'approbation distincte sur une convention (seulement dateCreation et un
// booléen approuveeParPlateforme) — impossible de tracer "dépôts vs
// validations" dans le temps. On affiche donc une seule série : le nombre
// de conventions déposées par mois.
function formatMoisLabel(mois) {
  const [annee, m] = mois.split("-");
  const date = new Date(Number(annee), Number(m) - 1, 1);
  return date.toLocaleDateString("fr-FR", { month: "short" });
}

export default function EvolutionConventionsCard({ depotsParMois }) {
  const donnees = depotsParMois || [];
  const max = Math.max(...donnees.map((d) => d.count), 1);

  return (
    <div className="rounded-md border border-border bg-card p-5">
      <h3 className="text-sm font-bold text-foreground">
        Évolution des conventions
      </h3>
      <p className="mb-4 text-xs text-muted-foreground">
        Dépôts par mois
      </p>

      {donnees.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Pas encore de convention déposée
        </p>
      )}

      {donnees.length > 0 && (
        <div className="flex h-40 items-end gap-2">
          {donnees.map((d) => (
            <div
              key={d.mois}
              className="flex flex-1 flex-col items-center gap-2"
            >
              <div className="flex h-32 w-full items-end">
                <div
                  className="w-full rounded-t-sm bg-primary/80"
                  style={{ height: `${(d.count / max) * 100}%` }}
                  title={`${d.count} convention${d.count > 1 ? "s" : ""}`}
                />
              </div>
              <span className="text-[11px] capitalize text-muted-foreground">
                {formatMoisLabel(d.mois)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}