"use client";

import { FiVideo, FiPhone, FiMapPin, FiUser } from "react-icons/fi";

const STATUT_LABELS = { planifie: "Planifié", termine: "Terminé", annule: "Annulé", reprogramme: "À reprogrammer", absent: "Absence" };
const STATUT_COLORS = {
  planifie: "bg-primary/10 text-primary",
  termine: "bg-success/10 text-green-700",
  annule: "bg-destructive/10 text-destructive",
  reprogramme: "bg-accent/40 text-amber-700",
  absent: "bg-destructive/10 text-destructive",
};
const MODE_ICONS = { video: FiVideo, telephone: FiPhone, presentiel: FiMapPin };
const MODE_LABELS = { video: "Vidéo", telephone: "Téléphone", presentiel: "Présentiel" };

export default function EntretienTodayCard({ entretien, nomAffiche, sousTitre }) {
  const ModeIcon = MODE_ICONS[entretien.modeEntretien];
  const heure = new Date(entretien.dateHeure).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="rounded-md border-l-4 border-primary bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {nomAffiche.split(" ").map((p) => p.charAt(0)).slice(0, 2).join("")}
          </span>
          <div>
            <p className="font-semibold text-foreground">{nomAffiche}</p>
            <p className="text-xs text-muted-foreground">{sousTitre}</p>
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUT_COLORS[entretien.statut]}`}>
          {STATUT_LABELS[entretien.statut]}
        </span>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-muted-foreground">{heure}</span>
        <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
          <ModeIcon className="h-3 w-3" />
          {MODE_LABELS[entretien.modeEntretien]}
        </span>
        {entretien.nomInterviewer && (
          <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
            <FiUser className="h-3 w-3" />
            {entretien.nomInterviewer}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        {entretien.lienGoogleMeet && entretien.modeEntretien === "video" ? (
          <a
            href={entretien.lienGoogleMeet}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-sm bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <FiVideo className="h-4 w-4" />
            Rejoindre
          </a>
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-sm bg-muted px-4 py-2 text-sm text-muted-foreground">
            {entretien.lienGoogleMeet || "Détails à venir"}
          </div>
        )}
      </div>
    </div>
  );
}