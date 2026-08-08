// Fonctions de calcul partagées — toutes basées sur de vraies données
// (dates du stage, notes des évaluations), aucune valeur inventée.

export const AVATAR_COLORS = [
  "#14B8A6",
  "#5B3DF5",
  "#F59E0B",
  "#3B82F6",
  "#EC4899",
  "#10B981",
  "#F97316",
];

export function getAvancement(stage) {
  const debut = new Date(stage.dateDebut).getTime();
  const fin = new Date(stage.dateFinPrevue).getTime();
  const now = Date.now();
  if (now <= debut) return 0;
  if (now >= fin) return 100;
  return Math.round(((now - debut) / (fin - debut)) * 100);
}

export function getJoursRestants(stage) {
  return Math.ceil(
    (new Date(stage.dateFinPrevue).getTime() - Date.now()) / 86400000,
  );
}

// Moyenne des 6 notes de la dernière évaluation soumise (ou null si aucune)
export function getMoyenneDerniereEvaluation(evaluations) {
  if (!evaluations || evaluations.length === 0) return null;
  const d = evaluations[evaluations.length - 1];
  const notes = [
    d.noteAssiduite,
    d.noteCommunication,
    d.noteInitiative,
    d.noteProfessionnalisme,
    d.noteTravailEquipe,
    d.notePerformanceTechnique,
  ];
  return notes.reduce((a, b) => a + b, 0) / notes.length;
}

export function getStatutAffichage(stage, moyenne) {
  if (stage.statut === "termine") return "termine";
  if (moyenne !== null && moyenne < 3) return "alerte";
  if (getJoursRestants(stage) <= 14) return "fin_proche";
  return "en_cours";
}

export const STATUT_CONFIG = {
  en_cours: {
    label: "En cours",
    color: "bg-primary/15 text-primary border border-primary/30 font-bold",
    bar: "bg-primary",
  },
  fin_proche: {
    label: "Fin proche",
    color: "bg-accent/30 text-amber-800 border border-accent/50 font-bold",
    bar: "bg-accent",
  },
  alerte: {
    label: "Alerte",
    color:
      "bg-destructive/15 text-destructive border border-destructive/30 font-bold",
    bar: "bg-destructive",
  },
  termine: {
    label: "Terminé",
    color: "bg-muted text-foreground border border-border font-bold",
    bar: "bg-muted-foreground",
  },
};
