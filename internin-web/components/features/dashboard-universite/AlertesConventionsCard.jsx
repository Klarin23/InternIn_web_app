import { FiClock } from "react-icons/fi";

function codeConvention(idConvention) {
  return `CNV-${idConvention.replace(/-/g, "").slice(0, 4).toUpperCase()}`;
}

export default function AlertesConventionsCard({ alertes }) {
  const liste = alertes || [];

  return (
    <div className="rounded-md border border-border bg-card p-5">
      <h3 className="mb-4 text-sm font-bold text-foreground">
        Conventions en attente
      </h3>

      {liste.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Aucune convention en attente de validation.
        </p>
      )}

      {liste.length > 0 && (
        <ul className="space-y-3">
          {liste.map((a) => (
            <li key={a.idConvention} className="flex items-center gap-3">
              <FiClock className="h-4 w-4 flex-shrink-0 text-amber-600" />
              <div className="min-w-0 text-sm">
                <p className="truncate font-medium text-foreground">
                  Convention {codeConvention(a.idConvention)} en attente depuis{" "}
                  {a.joursAttente} jour{a.joursAttente > 1 ? "s" : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
