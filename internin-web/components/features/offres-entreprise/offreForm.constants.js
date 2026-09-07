// Constantes partagées entre les étapes du formulaire d'offre (wizard) et
// l'aperçu final. Les libellés passent par i18n (labelKey).

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
  { id: 1, labelKey: "entrepriseSpace.offers.stepInfo", titleKey: "entrepriseSpace.offers.stepInfoTitle" },
  { id: 2, labelKey: "entrepriseSpace.offers.stepMissions", titleKey: "entrepriseSpace.offers.stepMissionsTitle" },
  { id: 3, labelKey: "entrepriseSpace.offers.stepConditions", titleKey: "entrepriseSpace.offers.stepConditionsTitle" },
  { id: 4, labelKey: "entrepriseSpace.offers.stepPreview", titleKey: "entrepriseSpace.offers.stepPreviewTitle" },
];

export const MODE_TRAVAIL_OPTIONS = [
  {
    value: "presentiel",
    labelKey: "entrepriseSpace.offers.modePresentiel",
    descKey: "entrepriseSpace.offers.modePresentielDesc",
    icon: FiHome,
  },
  {
    value: "distance",
    labelKey: "entrepriseSpace.offers.modeRemote",
    descKey: "entrepriseSpace.offers.modeRemoteDesc",
    icon: FiGlobe,
  },
  {
    value: "hybride",
    labelKey: "entrepriseSpace.offers.modeHybrid",
    descKey: "entrepriseSpace.offers.modeHybridDesc",
    icon: FiRefreshCw,
  },
];

export const REMUNERATION_OPTIONS = [
  {
    value: "aucune",
    labelKey: "entrepriseSpace.offers.remNone",
    icon: FiSlash,
    hasMontant: false,
  },
  {
    value: "indemnite_transport",
    labelKey: "entrepriseSpace.offers.remTransport",
    icon: FiTruck,
    hasMontant: false,
  },
  {
    value: "indemnite_repas",
    labelKey: "entrepriseSpace.offers.remMeals",
    icon: FiCoffee,
    hasMontant: false,
  },
  {
    value: "indemnite_internet_appel",
    labelKey: "entrepriseSpace.offers.remInternet",
    icon: FiPhone,
    hasMontant: false,
  },
  {
    value: "allocation_mensuelle",
    labelKey: "entrepriseSpace.offers.remMonthly",
    icon: FiCalendar,
    hasMontant: true,
  },
];

export const DUREE_OPTIONS = [
  { value: "1_mois", labelKey: "entrepriseSpace.offers.duration1" },
  { value: "2_mois", labelKey: "entrepriseSpace.offers.duration2" },
  { value: "3_mois", labelKey: "entrepriseSpace.offers.duration3" },
];

export function remunerationLabelFor(value, t) {
  const opt = REMUNERATION_OPTIONS.find((o) => o.value === value);
  if (!opt) return "";
  return t ? t(opt.labelKey) : opt.labelKey;
}

export function dureeLabelFor(value, t) {
  const opt = DUREE_OPTIONS.find((o) => o.value === value);
  if (!opt) return "";
  return t ? t(opt.labelKey) : opt.labelKey;
}

export function modeTravailLabelFor(value, t) {
  const opt = MODE_TRAVAIL_OPTIONS.find((o) => o.value === value);
  if (!opt) return "";
  return t ? t(opt.labelKey) : opt.labelKey;
}


/** Secteurs prédéfinis — valeur stockée = libellé FR stable (champ string en DB). */
export const SECTEUR_OPTIONS = [
  { value: "Informatique / Technologies", labelKey: "entrepriseSpace.offers.sectors.it" },
  { value: "Finance / Banque", labelKey: "entrepriseSpace.offers.sectors.finance" },
  { value: "Comptabilité", labelKey: "entrepriseSpace.offers.sectors.accounting" },
  { value: "Marketing / Communication", labelKey: "entrepriseSpace.offers.sectors.marketing" },
  { value: "Ressources humaines", labelKey: "entrepriseSpace.offers.sectors.hr" },
  { value: "Commerce / Vente", labelKey: "entrepriseSpace.offers.sectors.sales" },
  { value: "Administration / Gestion", labelKey: "entrepriseSpace.offers.sectors.admin" },
  { value: "Droit / Juridique", labelKey: "entrepriseSpace.offers.sectors.legal" },
  { value: "Ingénierie", labelKey: "entrepriseSpace.offers.sectors.engineering" },
  { value: "BTP / Construction", labelKey: "entrepriseSpace.offers.sectors.construction" },
  { value: "Industrie", labelKey: "entrepriseSpace.offers.sectors.industry" },
  { value: "Logistique / Transport", labelKey: "entrepriseSpace.offers.sectors.logistics" },
  { value: "Télécommunications", labelKey: "entrepriseSpace.offers.sectors.telecom" },
  { value: "Santé", labelKey: "entrepriseSpace.offers.sectors.health" },
  { value: "Éducation / Formation", labelKey: "entrepriseSpace.offers.sectors.education" },
  { value: "Agriculture", labelKey: "entrepriseSpace.offers.sectors.agriculture" },
  { value: "Énergie", labelKey: "entrepriseSpace.offers.sectors.energy" },
  { value: "Environnement", labelKey: "entrepriseSpace.offers.sectors.environment" },
  { value: "Tourisme / Hôtellerie", labelKey: "entrepriseSpace.offers.sectors.tourism" },
  { value: "Restauration", labelKey: "entrepriseSpace.offers.sectors.catering" },
  { value: "Immobilier", labelKey: "entrepriseSpace.offers.sectors.realEstate" },
  { value: "Assurance", labelKey: "entrepriseSpace.offers.sectors.insurance" },
  { value: "Conseil", labelKey: "entrepriseSpace.offers.sectors.consulting" },
  { value: "Médias", labelKey: "entrepriseSpace.offers.sectors.media" },
  { value: "ONG / Associations", labelKey: "entrepriseSpace.offers.sectors.ngo" },
  { value: "Recherche / Sciences", labelKey: "entrepriseSpace.offers.sectors.research" },
  { value: "Autre", labelKey: "entrepriseSpace.offers.sectors.other" },
];

/** Départements prédéfinis. */
export const DEPARTEMENT_OPTIONS = [
  { value: "Direction Générale", labelKey: "entrepriseSpace.offers.departments.generalManagement" },
  { value: "Administration", labelKey: "entrepriseSpace.offers.departments.administration" },
  { value: "Ressources Humaines", labelKey: "entrepriseSpace.offers.departments.hr" },
  { value: "Finance", labelKey: "entrepriseSpace.offers.departments.finance" },
  { value: "Comptabilité", labelKey: "entrepriseSpace.offers.departments.accounting" },
  { value: "Marketing", labelKey: "entrepriseSpace.offers.departments.marketing" },
  { value: "Communication", labelKey: "entrepriseSpace.offers.departments.communication" },
  { value: "Commercial / Ventes", labelKey: "entrepriseSpace.offers.departments.sales" },
  { value: "Informatique / IT", labelKey: "entrepriseSpace.offers.departments.it" },
  { value: "Développement", labelKey: "entrepriseSpace.offers.departments.development" },
  { value: "Support / Service client", labelKey: "entrepriseSpace.offers.departments.support" },
  { value: "Juridique", labelKey: "entrepriseSpace.offers.departments.legal" },
  { value: "Logistique", labelKey: "entrepriseSpace.offers.departments.logistics" },
  { value: "Production", labelKey: "entrepriseSpace.offers.departments.production" },
  { value: "Recherche & Développement", labelKey: "entrepriseSpace.offers.departments.rd" },
  { value: "Qualité", labelKey: "entrepriseSpace.offers.departments.quality" },
  { value: "Achats", labelKey: "entrepriseSpace.offers.departments.procurement" },
  { value: "Opérations", labelKey: "entrepriseSpace.offers.departments.operations" },
  { value: "Audit", labelKey: "entrepriseSpace.offers.departments.audit" },
  { value: "Maintenance", labelKey: "entrepriseSpace.offers.departments.maintenance" },
  { value: "Sécurité", labelKey: "entrepriseSpace.offers.departments.security" },
  { value: "Autre", labelKey: "entrepriseSpace.offers.departments.other" },
];

export function resolveOffreListValue(selected, custom) {
  const c = String(custom || "").trim();
  if (c) return c;
  const s = String(selected || "").trim();
  if (s && s.toLowerCase() !== "autre") return s;
  return "";
}

export function splitExistingListValue(value, options) {
  const v = String(value || "").trim();
  if (!v) return { selected: "", custom: "" };
  const found = options.find((o) => o.value === v);
  if (found) return { selected: found.value, custom: "" };
  return { selected: "Autre", custom: v };
}
