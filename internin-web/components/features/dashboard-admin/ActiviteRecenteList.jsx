const TONALITE_COULEUR = {
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
  verified: "#4F46E5",
  info: "#3B82F6",
};

function formatHeure(date) {
  return new Date(date).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ActiviteRecenteList({ activite = [] }) {
  const aujourdHui = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });

  return (
    <div className="rounded-md border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">Activité récente</h3>
        <span className="text-xs text-muted-foreground">
          Aujourd&apos;hui, {aujourdHui}
        </span>
      </div>

      {activite.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Aucune activité récente.
        </p>
      ) : (
        <ul className="space-y-4">
          {activite.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span
                className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full"
                style={{
                  backgroundColor:
                    TONALITE_COULEUR[item.tonalite] || TONALITE_COULEUR.info,
                }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {item.titre}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {item.sousTitre}
                </p>
              </div>
              <span className="flex-shrink-0 text-xs text-muted-foreground">
                {formatHeure(item.date)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}