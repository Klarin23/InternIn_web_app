export const COLONNES = [
  { id: "nouvelles", titreKey: "entrepriseSpace.candidatures.columnNew", titre: "Nouvelles", icon: "Inbox" },
  { id: "consultees", titreKey: "entrepriseSpace.candidatures.columnViewed", titre: "Consultées", icon: "Eye" },
  { id: "preselectionnees", titreKey: "entrepriseSpace.candidatures.columnPreselected", titre: "Présélectionnées", icon: "Star" },
  { id: "entretien", titreKey: "entrepriseSpace.candidatures.columnInterview", titre: "Entretien", icon: "Calendar" },
  { id: "acceptees", titreKey: "entrepriseSpace.candidatures.columnAccepted", titre: "Acceptées", icon: "CheckCircle2" },
  { id: "refusees", titreKey: "entrepriseSpace.candidatures.columnRejected", titre: "Refusées", icon: "XCircle" },
  { id: "retirees", titreKey: "entrepriseSpace.candidatures.columnWithdrawn", titre: "Retirées", icon: "Undo2" },
];

/**
 * Colonne Retirées uniquement : aucun drop ni drag.
 * (Le retrait est une action exclusive du stagiaire.)
 */
export const COLONNES_SANS_DND = new Set(["retirees"]);

const STATUTS_ENTRETIEN_ACTIFS = [
  "planifie",
  "valide",
  "confirme",
  "reprogramme",
];

/**
 * Une candidature acceptée (offre finale / stage engagé) ne peut plus
 * être déplacée nulle part.
 */
export function isCandidatureVerrouillee(candidature) {
  if (!candidature) return false;
  if (candidature.statut === "retiree") return true;
  if (candidature.statut === "acceptee") return true;
  // Si le backend expose un indicateur d'offre finale validée
  if (candidature.coordonneesDisponibles && candidature.statut === "acceptee") {
    return true;
  }
  return false;
}

// Détermine la colonne d'une candidature. "Entretien" est une colonne
// dérivée : statut réel toujours "preselectionnee" + un entretien actif.
export function getColonneCandidature(candidature, entretienParCandidature) {
  if (candidature.statut === "soumise") return "nouvelles";
  if (candidature.statut === "consultee") return "consultees";
  if (candidature.statut === "preselectionnee") {
    const entretien = entretienParCandidature[candidature.idCandidature];
    if (entretien && STATUTS_ENTRETIEN_ACTIFS.includes(entretien.statut)) {
      return "entretien";
    }
    return "preselectionnees";
  }
  if (candidature.statut === "acceptee") return "acceptees";
  if (candidature.statut === "rejetee") return "refusees";
  if (candidature.statut === "retiree") return "retirees";
  return null;
}

export const STATUT_PAR_COLONNE = {
  nouvelles: "soumise",
  consultees: "consultee",
  preselectionnees: "preselectionnee",
  refusees: "rejetee",
  // retirees : pas de mapping — action stagiaire uniquement
  // acceptees : flux offre finale (pas un simple changement de statut)
};
