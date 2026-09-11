// Détermine si les informations professionnelles essentielles à l'évaluation
// d'un candidat par une entreprise sont renseignées.
// Cette vérification est volontairement distincte de la complétion générale
// du compte : le CV, les centres d'intérêt et les préférences ne sont pas
// considérés ici comme indispensables puisque l'entreprise évalue le profil
// structuré du candidat sans accéder au CV.

const CRITERES_EVALUATION = [
  {
    id: "titre",
    labelKey: "stagiaireSpace.profile.evaluationCompletion.items.titre",
    check: (p) => Boolean(p?.titreProfessionnel?.trim()),
  },
  {
    id: "presentation",
    labelKey: "stagiaireSpace.profile.evaluationCompletion.items.presentation",
    check: (p) => Boolean(p?.presentation?.trim()),
  },
  {
    id: "formation",
    labelKey: "stagiaireSpace.profile.evaluationCompletion.items.formation",
    check: (p) => (p?.formations?.length || 0) > 0,
  },
  {
    id: "experience",
    labelKey: "stagiaireSpace.profile.evaluationCompletion.items.experience",
    check: (p) => (p?.experiencesProfessionnelles?.length || 0) > 0,
  },
  {
    id: "competences",
    labelKey: "stagiaireSpace.profile.evaluationCompletion.items.competences",
    check: (p) =>
      (p?.competences || []).some((competence) => competence?.typeCompetence !== "langue"),
  },
  {
    id: "qualites",
    labelKey: "stagiaireSpace.profile.evaluationCompletion.items.qualites",
    check: (p) => (p?.qualites?.length || 0) > 0,
  },
  {
    id: "langues",
    labelKey: "stagiaireSpace.profile.evaluationCompletion.items.langues",
    check: (p) =>
      (p?.competences || []).some((competence) => competence?.typeCompetence === "langue"),
  },
];

export function calculerCompletionEvaluationProfil(profil) {
  if (!profil) {
    return {
      pourcentage: 0,
      elements: [],
      manquants: [],
      complet: false,
    };
  }

  const elements = CRITERES_EVALUATION.map((critere) => ({
    id: critere.id,
    labelKey: critere.labelKey,
    fait: critere.check(profil),
  }));

  const nbFaits = elements.filter((element) => element.fait).length;
  const pourcentage = Math.round((nbFaits / elements.length) * 100);

  return {
    pourcentage,
    elements,
    manquants: elements.filter((element) => !element.fait),
    complet: pourcentage === 100,
  };
}
