// Logique de statut partagée pour les entretiens stagiaire — mêmes 7
// statuts réels que ceux déjà gérés dans EntretienCardStagiaire.jsx,
// juste centralisés pour être réutilisés par le header, les cartes, le
// drawer et l'historique.

import {
  FiClock,
  FiCheckCircle,
  FiRefreshCw,
  FiXCircle,
  FiCheck,
} from "react-icons/fi";

export const STATUTS_PASSES = ["termine", "annule", "absent"];

const STATUT_CONFIG = {
  planifie: {
    labelKey: "interviews.status.pendingResponse",
    badgeKey: "interviews.status.pending",
    className: "bg-[#FEF3C7] text-[#B45309]",
    Icon: FiClock,
  },
  valide: {
    labelKey: "interviews.status.validatedWaiting",
    badgeKey: "interviews.status.validated",
    className: "bg-[#DBEAFE] text-[#1D4ED8]",
    Icon: FiCheck,
  },
  confirme: {
    labelKey: "interviews.status.confirmed",
    badgeKey: "interviews.status.confirmed",
    className: "bg-success/15 text-green-700",
    Icon: FiCheckCircle,
  },
  reprogramme: {
    labelKey: "interviews.status.rescheduling",
    badgeKey: "interviews.status.rescheduled",
    className: "bg-[#FEF3C7] text-[#B45309]",
    Icon: FiRefreshCw,
  },
  termine: {
    labelKey: "interviews.status.completed",
    badgeKey: "interviews.status.completed",
    className: "bg-muted text-muted-foreground",
    Icon: FiCheckCircle,
  },
  annule: {
    labelKey: "interviews.status.cancelled",
    badgeKey: "interviews.status.cancelled",
    className: "bg-destructive/10 text-destructive",
    Icon: FiXCircle,
  },
  absent: {
    labelKey: "interviews.status.absenceNoted",
    badgeKey: "interviews.status.absence",
    className: "bg-destructive/10 text-destructive",
    Icon: FiXCircle,
  },
};

export { STATUT_CONFIG };

export function formatDateJour(date, locale = "fr") {
  const s = date.toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return s.charAt(0).toUpperCase() + s.slice(1);
}
export function formatHeure(date, locale = "fr") {
  return date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatJourRelatif(date, maintenant, locale = "fr-FR", t) {
  const auj = new Date(maintenant);

  const diffJours = Math.round(
    (new Date(date.toDateString()) - new Date(auj.toDateString())) / 86_400_000,
  );

  if (diffJours === 0) {
    return t ? t("interviews.relative.today") : "Aujourd'hui";
  }

  if (diffJours === 1) {
    return t ? t("interviews.relative.tomorrow") : "Demain";
  }

  return formatDateJour(date, locale);
}

export function formatCompteARebours(date, maintenant, t) {
  const diffMs = date.getTime() - maintenant;

  if (diffMs <= 0 || diffMs > 24 * 3_600_000) {
    return null;
  }

  const heures = Math.floor(diffMs / 3_600_000);
  const minutes = Math.floor((diffMs % 3_600_000) / 60_000);

  if (heures === 0) {
    return t
      ? t("interviews.countdown.minutes", { n: minutes })
      : `Commence dans ${minutes} min`;
  }

  return t
    ? t("interviews.countdown.hoursMinutes", {
        hours: heures,
        minutes,
      })
    : `Commence dans ${heures}h ${minutes}min`;
}

// Annonce discrète demandée en section 11 de la refonte : "dans 3 jours",
// "demain à 10:30", "aujourd'hui à 10:30". Disparaît une fois l'heure
// passée (pas de compte à rebours agressif, une seule phrase informative).
export function formatAnnonceEntretien(date, maintenant, locale = "fr", t) {
  if (date.getTime() <= maintenant) return null;

  const diffJours = Math.round(
    (new Date(date.toDateString()) -
      new Date(new Date(maintenant).toDateString())) /
      86_400_000,
  );
  const heure = formatHeure(date, locale);

  if (diffJours === 0) {
    return t
      ? t("interviews.announce.today", { time: heure })
      : `Entretien aujourd'hui à ${heure}`;
  }
  if (diffJours === 1) {
    return t
      ? t("interviews.announce.tomorrow", { time: heure })
      : `Entretien demain à ${heure}`;
  }
  if (diffJours > 1) {
    return t
      ? t("interviews.announce.inDays", { n: diffJours })
      : `Entretien dans ${diffJours} jours`;
  }
  return null;
}

export const FILTRES_ENTRETIEN = [
  {
    valeur: "a_venir",
    labelKey: "interviews.filters.upcoming",
  },
  {
    valeur: "aujourdhui",
    labelKey: "interviews.filters.today",
  },
  {
    valeur: "termines",
    labelKey: "interviews.filters.completed",
  },
  {
    valeur: "annules",
    labelKey: "interviews.filters.cancelled",
  },
  {
    valeur: "toutes",
    labelKey: "interviews.filters.all",
  },
];

export function matchFiltreEntretien(entretien, filtre, maintenant) {
  if (filtre === "toutes") return true;
  if (filtre === "a_venir") return !STATUTS_PASSES.includes(entretien.statut);
  if (filtre === "aujourdhui") {
    return (
      !STATUTS_PASSES.includes(entretien.statut) &&
      new Date(entretien.dateHeure).toDateString() ===
        new Date(maintenant).toDateString()
    );
  }
  if (filtre === "termines") return entretien.statut === "termine";
  if (filtre === "annules") return entretien.statut === "annule";
  return true;
}

export function matchRechercheEntretien(entretien, recherche) {
  if (!recherche?.trim()) return true;
  const q = recherche.trim().toLowerCase();
  return (
    entretien.titreOffre?.toLowerCase().includes(q) ||
    entretien.nomEntreprise?.toLowerCase().includes(q)
  );
}

// Lien "Ajouter au calendrier" (section 10) — génère une URL Google Calendar
// prête à l'emploi, sans dépendance ni appel serveur. Durée par défaut de
// 1h (le backend ne stocke pas de durée d'entretien).
export function buildLienGoogleCalendar(entretien) {
  const debut = new Date(entretien.dateHeure);
  const fin = new Date(debut.getTime() + 60 * 60_000);
  const fmt = (d) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Entretien — ${entretien.titreOffre}`,
    dates: `${fmt(debut)}/${fmt(fin)}`,
    details: `Entretien avec ${entretien.nomEntreprise} pour l'offre "${entretien.titreOffre}".`,
  });
  if (entretien.modeEntretien === "presentiel" && entretien.lienGoogleMeet) {
    params.set("location", entretien.lienGoogleMeet);
  } else if (entretien.modeEntretien === "video" && entretien.lienGoogleMeet) {
    params.set("location", entretien.lienGoogleMeet);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
