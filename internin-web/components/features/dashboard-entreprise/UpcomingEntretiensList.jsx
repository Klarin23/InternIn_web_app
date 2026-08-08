import Link from "next/link";

const STATUT_LABELS = { planifie: "Planifié", termine: "Terminé", annule: "Annulé", reprogramme: "À reprogrammer", absent: "Absence" };
const STATUT_COLORS = {
  planifie: "bg-primary/10 text-primary",
  termine: "bg-success/10 text-green-700",
  annule: "bg-destructive/10 text-destructive",
  reprogramme: "bg-accent/40 text-amber-700",
  absent: "bg-destructive/10 text-destructive",
};

export default function UpcomingEntretiensList({ entretiens }) {
  const prochains = [...(entretiens || [])]
    .filter((e) => e.statut === "planifie" && new Date(e.dateHeure) > new Date())
    .sort((a, b) => new Date(a.dateHeure) - new Date(b.dateHeure))
    .slice(0, 4);

  return (
    <div className="rounded-md border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h5 className="text-sm font-semibold text-foreground">Entretiens à venir</h5>
        <Link href="/entretiens-entreprise" className="text-xs font-semibold text-secondary-foreground hover:underline">
          Voir tout
        </Link>
      </div>

      {prochains.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Aucun entretien à venir</p>
      ) : (
        <div className="space-y-3">
          {prochains.map((e) => {
            const date = new Date(e.dateHeure);
            return (
              <div key={e.idEntretien} className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 flex-col items-center justify-center rounded-sm bg-muted text-foreground">
                  <span className="text-[10px] font-medium leading-none text-muted-foreground">
                    {date.toLocaleDateString("fr-FR", { month: "short" })}
                  </span>
                  <span className="text-sm font-bold leading-tight">{date.getDate()}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{e.prenom} {e.nom}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUT_COLORS[e.statut]}`}>
                  {STATUT_LABELS[e.statut]}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}