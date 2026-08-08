// Chemin : internin-web/lib/entretiens/planification.js
//
// Configuration partagée pour la planification/l'affichage du mode d'un
// entretien (vidéo / téléphone / présentiel). Centralise ce qui était
// dupliqué (MODE_ICONS/MODE_LABELS) dans PlanifierEntretienDialog,
// EntretienCardEntreprise, EntretienCardStagiaire, EntretienDetailsDrawer.
//
// IMPORTANT : le champ backend reste "lienGoogleMeet" quel que soit le mode
// (lien vidéo, adresse, ou numéro de téléphone) — voir entretiens.service.js
// côté API. On ne renomme rien pour ne pas casser l'API existante.

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

// Libellé du champ dynamique (section 4 de la spec) selon le mode choisi.
export function champLienConfig(mode) {
  if (mode === "video") {
    return {
      label: "Lien de visioconférence",
      Icon: FiVideo,
      placeholder: "https://meet.google.com/...",
      aide: "Vous pouvez utiliser Google Meet, Zoom, Microsoft Teams ou une autre plateforme de visioconférence.",
      type: "url",
    };
  }
  if (mode === "telephone") {
    return {
      label: "Numéro de téléphone",
      Icon: FiPhone,
      placeholder: "+237 6XX XX XX XX",
      aide: "Numéro sur lequel le candidat pourra être appelé.",
      type: "tel",
    };
  }
  return {
    label: "Adresse du rendez-vous",
    Icon: FiMapPin,
    placeholder: "Ex. : Akwa, Douala — Rue...",
    aide: "Adresse complète où se déroulera l'entretien.",
    type: "text",
  };
}

// Validation légère côté client — le contrôle strict (URL http/https pour
// le mode vidéo) reste fait côté serveur dans entretiens.service.js
// (validerLienVisio). Ici on donne juste un feedback immédiat à l'usager.
export function validerChampLien(mode, valeur) {
  const v = (valeur || "").trim();
  if (!v) return { valide: true, message: "" }; // facultatif dans les deux cas

  if (mode === "video") {
    try {
      const url = new URL(v);
      if (!["http:", "https:"].includes(url.protocol)) {
        return {
          valide: false,
          message: "Le lien doit être une URL valide (https://...)",
        };
      }
      return { valide: true, message: "" };
    } catch {
      return {
        valide: false,
        message: "Le lien doit être une URL valide (https://...)",
      };
    }
  }

  if (mode === "telephone") {
    // Validation raisonnable : chiffres, espaces, +, - autorisés, 8 à 20
    // caractères utiles. Pas de contrainte stricte par pays (candidats
    // internationaux) — cohérent avec l'absence de validation backend
    // sur ce champ pour ce mode.
    const chiffres = v.replace(/[^\d]/g, "");
    if (chiffres.length < 8 || !/^[\d+\s().-]+$/.test(v)) {
      return { valide: false, message: "Ce numéro ne semble pas valide" };
    }
    return { valide: true, message: "" };
  }

  // presentiel : pas de format à valider, juste une adresse libre
  return { valide: true, message: "" };
}

// Sépare/combine une date ISO (dateHeure du backend) en deux valeurs
// pour des inputs date + time distincts (section 2 de la spec).
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
  // Format compatible avec `new Date(dateHeure)` côté backend
  // (entretiens.service.js) — même format que l'ancien input datetime-local.
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
