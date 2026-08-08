// Génère une analyse à partir des 6 notes d'une évaluation.
// ⚠️ Implémentation basée sur des règles (pas un vrai appel à un LLM) —
// voir la note donnée à l'utilisateur. Cette fonction peut être remplacée
// plus tard par un appel à une API d'IA générative (OpenAI, Anthropic...)
// sans changer sa signature (evaluation -> { forces, axesAmelioration,
// actionsRecommandees, resumeProgression }).

const CRITERES = [
  { key: "noteAssiduite", label: "assiduité" },
  { key: "noteCommunication", label: "communication" },
  { key: "noteInitiative", label: "initiative" },
  { key: "noteProfessionnalisme", label: "professionnalisme" },
  { key: "noteTravailEquipe", label: "travail d'équipe" },
  { key: "notePerformanceTechnique", label: "performance technique" },
];

const ACTIONS_PAR_CRITERE = {
  noteAssiduite:
    "Fixez-vous un rappel quotidien pour structurer vos horaires et anticiper les imprévus.",
  noteCommunication:
    "Prenez l'habitude de faire un point oral court avec votre équipe chaque matin.",
  noteInitiative:
    "Proposez une idée d'amélioration concrète lors de votre prochaine réunion d'équipe.",
  noteProfessionnalisme:
    "Relisez les échanges professionnels avant de les envoyer pour en soigner la forme.",
  noteTravailEquipe:
    "Proposez votre aide à un collègue sur une tâche en cours cette semaine.",
  notePerformanceTechnique:
    "Identifiez une ressource ou un tutoriel pour renforcer une compétence technique précise.",
};

export function genererAnalyseCoachIA(evaluation) {
  const scores = CRITERES.map((c) => ({ ...c, valeur: evaluation[c.key] }));
  const meilleur = scores.reduce((a, b) => (b.valeur > a.valeur ? b : a));
  const plusFaible = scores.reduce((a, b) => (b.valeur < a.valeur ? b : a));
  const moyenne = scores.reduce((sum, c) => sum + c.valeur, 0) / scores.length;

  const forces = `Cette semaine, votre point fort est votre ${meilleur.label} (${meilleur.valeur}/5). Continuez sur cette lancée !`;
  const axesAmelioration = `Votre ${plusFaible.label} pourrait être renforcée (${plusFaible.valeur}/5) — c'est un axe à travailler pour la suite.`;
  const actionsRecommandees = ACTIONS_PAR_CRITERE[plusFaible.key];
  const resumeProgression =
    moyenne >= 4
      ? `Excellente semaine, avec une moyenne de ${moyenne.toFixed(1)}/5 sur l'ensemble des critères.`
      : moyenne >= 3
        ? `Semaine correcte, avec une moyenne de ${moyenne.toFixed(1)}/5. Des marges de progression existent.`
        : `Semaine plus difficile, avec une moyenne de ${moyenne.toFixed(1)}/5. N'hésitez pas à échanger avec votre superviseur.`;

  return { forces, axesAmelioration, actionsRecommandees, resumeProgression };
}
