// Chemin : internin-web/lib/entretiens/planification.js
//
// Configuration partagée pour la planification/l'affichage du mode d'un
// entretien (vidéo / téléphone / présentiel).
//
// IMPORTANT : le champ backend reste "lienGoogleMeet" quel que soit le mode
// (lien vidéo, adresse, ou numéro de téléphone).

import { FiVideo, FiPhone, FiMapPin } from "react-icons/fi";

export const MODES_ENTRETIEN = [
  {
    valeur: "video",
    label: "Visioconférence",
    description: "Google Meet, Zoom, Teams...",
    Icon: FiVideo,
  },
  {
    valeur: "telephone",
    label: "Téléphone",
    description: "Appel téléphonique",
    Icon: FiPhone,
  },
  {
    valeur: "presentiel",
    label: "Présentiel",
    description: "Rencontre sur place",
    Icon: FiMapPin,
  },
];

export const MODE_ICONS = Object.fromEntries(
  MODES_ENTRETIEN.map((m) => [m.valeur, m.Icon]),
);
export const MODE_LABELS = Object.fromEntries(
  MODES_ENTRETIEN.map((m) => [m.valeur, m.label]),
);

export function champLienConfig(mode) {
  if (mode === "video") {
    return {
      label: "Lien de visioconférence",
      Icon: FiVideo,
      placeholder: "https://meet.google.com/... ou https://zoom.us/j/...",
      aide: "Obligatoire. Collez le lien Google Meet, Zoom, Microsoft Teams ou une autre plateforme.",
      type: "url",
      obligatoire: true,
    };
  }
  if (mode === "telephone") {
    return {
      label: "Numéro de téléphone",
      Icon: FiPhone,
      placeholder: "+237 6XX XX XX XX",
      aide: "Optionnel. Numéro sur lequel le candidat pourra être appelé.",
      type: "tel",
      obligatoire: false,
    };
  }
  return {
    label: "Adresse / localisation",
    Icon: FiMapPin,
    placeholder: "Ex. : Rue de la Joie, Akwa, Douala — ou lien Google Maps",
    aide: "Obligatoire. Indiquez l'adresse exacte ou un lien Google Maps pour que le candidat sache où se rendre.",
    type: "text",
    obligatoire: true,
  };
}

export function validerChampLien(mode, valeur) {
  const v = (valeur || "").trim();

  if (mode === "video") {
    if (!v) {
      return {
        valide: false,
        message:
          "Le lien de visioconférence (Google Meet, Zoom, Teams...) est obligatoire",
      };
    }
    try {
      const url = new URL(v);
      if (!["http:", "https:"].includes(url.protocol)) {
        return {
          valide: false,
          message: "Le lien doit être une URL valide[](https://...)",
        };
      }
      return { valide: true, message: "" };
    } catch {
      return {
        valide: false,
        message: "Le lien doit être une URL valide[](https://...)",
      };
    }
  }

  if (mode === "telephone") {
    if (!v) return { valide: true, message: "" };
    const chiffres = v.replace(/[^\d]/g, "");
    if (chiffres.length < 8 || !/^[\d+\s().-]+$/.test(v)) {
      return { valide: false, message: "Ce numéro ne semble pas valide" };
    }
    return { valide: true, message: "" };
  }

  // presentiel
  if (!v || v.length < 5) {
    return {
      valide: false,
      message:
        "L'adresse ou la localisation de l'entretien en présentiel est obligatoire",
    };
  }
  return { valide: true, message: "" };
}

export function dateHeureVersChamps(dateHeureIso) {
  if (!dateHeureIso) return { date: "", heure: "" };
  const d = new Date(dateHeureIso);
  if (Number.isNaN(d.getTime())) return { date: "", heure: "" };
  const pad = (n) => String(n).padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    heure: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

export function champsVersDateHeure(date, heure) {
  if (!date || !heure) return "";
  return `${date}T${heure}`;
}

export function estDateHeurePassee(date, heure) {
  const iso = champsVersDateHeure(date, heure);
  if (!iso) return false;
  return new Date(iso).getTime() < Date.now();
}

export function formatDateLongue(date, heure) {
  const iso = champsVersDateHeure(date, heure);
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const jour = d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return jour.charAt(0).toUpperCase() + jour.slice(1);
}

export function formatHeureCourte(heure) {
  return heure || "";
}
