import { FiVideo, FiPhone, FiMapPin } from "react-icons/fi";

const STATUT_LABELS = {
  planifie: "Planifié",
  termine: "Terminé",
  annule: "Annulé",
  reprogramme: "À reprogrammer",
  absent: "Absence",
};
const STATUT_COLORS = {
  planifie: "bg-primary/10 text-primary",
  termine: "bg-success/10 text-green-700",
  annule: "bg-destructive/10 text-destructive",
  reprogramme: "bg-accent/40 text-amber-700",
  absent: "bg-destructive/10 text-destructive",
};
const MODE_ICONS = { video: FiVideo, telephone: FiPhone, presentiel: FiMapPin };
const MODE_LABELS = {
  video: "Vidéo",
  telephone: "Téléphone",
  presentiel: "Présentiel",
};
const AVATAR_COLORS = [
  "#14B8A6",
  "#5B3DF5",
  "#F59E0B",
  "#3B82F6",
  "#EC4899",
  "#10B981",
];

export default function EntretienListRow({
  entretien,
  nomAffiche,
  sousTitre,
  index,
}) {
  const date = new Date(entretien.dateHeure);
  const ModeIcon = MODE_ICONS[entretien.modeEntretien];
  const couleur = AVATAR_COLORS[index % AVATAR_COLORS.length];

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-border px-2 py-4 last:border-0">
      <div className="flex h-10 w-10 flex-shrink-0 flex-col items-center justify-center rounded-sm bg-muted text-foreground">
        <span className="text-[10px] font-medium leading-none text-muted-foreground">
          {date.toLocaleDateString("fr-FR", { month: "short" })}
        </span>
        <span className="text-sm font-bold leading-tight">
          {date.getDate()}
        </span>
      </div>

      <span
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
        style={{ backgroundColor: couleur }}
      >
        {nomAffiche
          .split(" ")
          .map((p) => p.charAt(0))
          .slice(0, 2)
          .join("")}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {nomAffiche}
        </p>
        <p className="truncate text-xs text-muted-foreground">{sousTitre}</p>
      </div>

      <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
        <ModeIcon className="h-3 w-3" />
        {MODE_LABELS[entretien.modeEntretien]}
      </span>
      <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
        {date.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
      <span
        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUT_COLORS[entretien.statut]}`}
      >
        {STATUT_LABELS[entretien.statut]}
      </span>
    </div>
  );
}
