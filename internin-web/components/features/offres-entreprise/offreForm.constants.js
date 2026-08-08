// Constantes partagées entre les étapes du formulaire d'offre (wizard) et
// l'aperçu final. Centralisées ici pour garantir un seul endroit à modifier
// si un libellé ou une valeur backend change.

import {
  FiHome,
  FiGlobe,
  FiRefreshCw,
  FiTruck,
  FiCoffee,
  FiPhone,
  FiCalendar,
  FiSlash,
} from "react-icons/fi";

export const OFFRE_FORM_STEPS = [
  { id: 1, label: "Informations", title: "Informations générales" },
  { id: 2, label: "Missions", title: "Missions & profil recherché" },
  { id: 3, label: "Conditions", title: "Conditions du stage" },
  { id: 4, label: "Aperçu", title: "Aperçu & publication" },
];

// Valeurs backend inchangées : distance / hybride / presentiel.
export const MODE_TRAVAIL_OPTIONS = [
  {
    value: "presentiel",
    label: "Présentiel",
    description: "Travail sur place",
    icon: FiHome,
  },
  {
    value: "distance",
    label: "À distance",
    description: "Travail en ligne",
    icon: FiGlobe,
  },
  {
    value: "hybride",
    label: "Hybride",
    description: "Sur place + distant",
    icon: FiRefreshCw,
  },
];

// Valeurs backend inchangées. "indemnite_internet_appel" est bien supportée
// par l'API (offres.schema.js côté internin-api) : elle était juste absente
// du schéma Zod frontend, ce qui provoquait un rejet de validation côté
// client alors même que le Select la proposait déjà.
export const REMUNERATION_OPTIONS = [
  {
    value: "aucune",
    label: "Non rémunéré",
    icon: FiSlash,
    hasMontant: false,
  },
  {
    value: "indemnite_transport",
    label: "Indemnité transport",
    icon: FiTruck,
    hasMontant: false,
  },
  {
    value: "indemnite_repas",
    label: "Indemnité repas",
    icon: FiCoffee,
    hasMontant: false,
  },
  {
    value: "indemnite_internet_appel",
    label: "Indemnité internet / appel",
    icon: FiPhone,
    hasMontant: false,
  },
  {
    value: "allocation_mensuelle",
    label: "Allocation mensuelle",
    icon: FiCalendar,
    hasMontant: true,
  },
];

export const DUREE_OPTIONS = [
  { value: "1_mois", label: "1 mois" },
  { value: "2_mois", label: "2 mois" },
  { value: "3_mois", label: "3 mois" },
];

export function remunerationLabelFor(value) {
  return REMUNERATION_OPTIONS.find((o) => o.value === value)?.label ?? "";
}

export function dureeLabelFor(value) {
  return DUREE_OPTIONS.find((o) => o.value === value)?.label ?? "";
}

export function modeTravailLabelFor(value) {
  return MODE_TRAVAIL_OPTIONS.find((o) => o.value === value)?.label ?? "";
}
