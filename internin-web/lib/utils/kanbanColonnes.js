export const COLONNES = [
  { id: "nouvelles", titre: "Nouvelles", emoji: "🆕" },
  { id: "consultees", titre: "Consultées", emoji: "👀" },
  { id: "preselectionnees", titre: "Présélectionnées", emoji: "⭐" },
  { id: "entretien", titre: "Entretien", emoji: "📅" },
  { id: "acceptees", titre: "Acceptées", emoji: "✅" },
  { id: "refusees", titre: "Refusées", emoji: "❌" },
];

const STATUTS_ENTRETIEN_ACTIFS = [
  "planifie",
  "valide",
  "confirme",
  "reprogramme",
];

// Détermine la colonne d'une candidature. "Entretien" est une colonne
// dérivée : statut réel toujours "preselectionnee" + un entretien actif
// existe pour cette candidature (cf. absence de statut "entretien" en base).
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
  return null; // "retiree" (candidat s'est désisté) : non affiché dans le Kanban
}

export const STATUT_PAR_COLONNE = {
  nouvelles: "soumise",
  consultees: "consultee",
  preselectionnees: "preselectionnee",
  refusees: "rejetee",
};
