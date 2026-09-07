"use client";
import { getZonedDateParts } from "@/lib/entretiens/planification";

import { FiVideo, FiPhone, FiMapPin } from "react-icons/fi";
import { useTranslation } from "@/lib/i18n/useTranslation";

const STATUT_LABEL_KEYS = {
  planifie: "interviews.entreprise.statusPlanifie",
  valide: "interviews.entreprise.statusValide",
  confirme: "interviews.entreprise.statusConfirme",
  termine: "interviews.entreprise.statusTermine",
  annule: "interviews.entreprise.statusAnnule",
  reprogramme: "interviews.entreprise.statusReprogramme",
  absent: "interviews.entreprise.statusAbsent",
};
const STATUT_COLORS = {
  planifie: "bg-primary/10 text-primary",
  valide: "bg-primary/10 text-primary",
  confirme: "bg-success/10 text-green-700 dark:text-green-400",
  termine: "bg-success/10 text-green-700 dark:text-green-400",
  annule: "bg-destructive/10 text-destructive",
  reprogramme: "bg-accent/40 text-amber-700 dark:text-amber-300",
  absent: "bg-destructive/10 text-destructive",
};
const MODE_ICONS = { video: FiVideo, telephone: FiPhone, presentiel: FiMapPin };
const MODE_LABEL_KEYS = {
  video: "interviews.entreprise.modeVideo",
  telephone: "interviews.entreprise.modePhone",
  presentiel: "interviews.entreprise.modeOnsite",
};
const AVATAR_COLORS = [
  "#14B8A6",
  "#5B3DF5",
  "#F59E0B",
  "#3B82F6",
  "#EC4899",
  "#10B981",
];

function toLocaleTag(locale) {
  if (!locale) return "fr-FR";
  return String(locale).toLowerCase().startsWith("en") ? "en-GB" : "fr-FR";
}

export default function EntretienListRow({
  entretien,
  nomAffiche,
  sousTitre,
  index,
}) {
  const { t, locale } = useTranslation();
  const date = new Date(entretien.dateHeure);
  const ModeIcon = MODE_ICONS[entretien.modeEntretien] || FiVideo;
  const couleur = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const loc = toLocaleTag(locale);

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-border px-2 py-4 last:border-0">
      <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-sm bg-muted text-foreground">
        <span className="text-[10px] font-medium leading-none text-muted-foreground">
          {date.toLocaleDateString(loc, { timeZone: "Africa/Douala", month: "short" })}
        </span>
        <span className="text-sm font-bold leading-tight">
          {getZonedDateParts(date)?.day ?? "—"}
        </span>
      </div>

      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
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
        {t(MODE_LABEL_KEYS[entretien.modeEntretien] || MODE_LABEL_KEYS.video)}
      </span>
      <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
        {date.toLocaleTimeString(loc, { timeZone: "Africa/Douala",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
      <span
        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUT_COLORS[entretien.statut] || "bg-muted text-muted-foreground"}`}
      >
        {t(STATUT_LABEL_KEYS[entretien.statut] || STATUT_LABEL_KEYS.planifie)}
      </span>
    </div>
  );
}
