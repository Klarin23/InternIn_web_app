// Calcule le taux de complétion du profil stagiaire à partir des données
// RÉELLEMENT présentes dans l'objet `profil` renvoyé par GET /stagiaires/me.
//
// Pourquoi ne pas utiliser `profil.scoreCompletudeProfil` (colonne existante
// en base) : ce score n'est calculé qu'une seule fois, à la fin de
// l'onboarding (voir calculerScoreCompletude côté API), et n'est jamais
// recalculé lors des mises à jour ultérieures du profil. L'afficher tel
// quel donnerait donc un pourcentage obsolète dès que l'étudiant modifie
// son profil depuis cette page. On calcule ici un score toujours à jour,
// uniquement à partir des champs réels — aucune donnée n'est inventée.

const CRITERES = [
  {
    id: "photo",
    label: "Ajouter une photo de profil",
    check: (p) => Boolean(p.photoProfilUrl),
  },
  {
    id: "titre",
    label: "Ajouter un titre professionnel",
    check: (p) => Boolean(p.titreProfessionnel?.trim()),
  },
  {
    id: "presentation",
    label: "Ajouter une présentation",
    check: (p) => Boolean(p.presentation?.trim()),
  },
  {
    id: "formation",
    label: "Ajouter votre formation",
    check: (p) => (p.formations?.length || 0) > 0,
  },
  {
    id: "competences",
    label: "Ajouter vos compétences",
    check: (p) => (p.competences?.length || 0) > 0,
  },
  {
    id: "cv",
    label: "Ajouter votre CV",
    check: (p) => Boolean(p.cvUrl),
  },
  {
    id: "centresInteret",
    label: "Ajouter vos centres d'intérêt",
    check: (p) => (p.centresInteret?.length || 0) > 0,
  },
  {
    id: "preferences",
    label: "Définir vos préférences de recherche",
    check: (p) =>
      (p.secteursRecherches?.length || 0) > 0 ||
      (p.villesRecherchees?.length || 0) > 0,
  },
];

// Même logique que ci-dessus, côté entreprise cette fois. Les critères
// reproduisent EXACTEMENT `CHAMPS_COMPLETUDE` défini dans
// internin-api/src/modules/entreprises/entreprises.service.js (source de
// vérité), afin que le pourcentage affiché pendant l'édition du profil
// corresponde à celui que l'API recalculera après sauvegarde. On ne calcule
// ici que pour donner un retour visuel immédiat pendant la saisie — aucune
// donnée n'est inventée, uniquement les champs déjà exposés par l'API.
const CRITERES_ENTREPRISE = [
  { id: "logoUrl", label: "votre logo", check: (p) => Boolean(p.logoUrl) },
  {
    id: "secteurActivite",
    label: "votre secteur d'activité",
    check: (p) => Boolean(p.secteurActivite?.trim?.() ?? p.secteurActivite),
  },
  {
    id: "tailleEntreprise",
    label: "la taille de l'entreprise",
    check: (p) => Boolean(p.tailleEntreprise),
  },
  {
    id: "siteWeb",
    label: "votre site web",
    check: (p) => Boolean(p.siteWeb?.trim?.() ?? p.siteWeb),
  },
  {
    id: "adresse",
    label: "votre adresse",
    check: (p) => Boolean(p.adresse?.trim?.() ?? p.adresse),
  },
  {
    id: "aPropos",
    label: "une description de l'entreprise",
    check: (p) => Boolean(p.aPropos?.trim?.() ?? p.aPropos),
  },
];

export function calculerCompletionEntreprise(profil) {
  if (!profil) {
    return { pourcentage: 0, elements: [], manquants: [], complet: false };
  }

  const elements = CRITERES_ENTREPRISE.map((c) => ({
    id: c.id,
    label: c.label,
    fait: c.check(profil),
  }));

  const nbFaits = elements.filter((e) => e.fait).length;
  const pourcentage = Math.round((nbFaits / elements.length) * 100);

  return {
    pourcentage,
    elements,
    manquants: elements.filter((e) => !e.fait),
    complet: pourcentage === 100,
  };
}

export function calculerCompletionProfil(profil) {
  if (!profil) {
    return { pourcentage: 0, elements: [], complet: false };
  }

  const elements = CRITERES.map((c) => ({
    id: c.id,
    label: c.label,
    fait: c.check(profil),
  }));

  const nbFaits = elements.filter((e) => e.fait).length;
  const pourcentage = Math.round((nbFaits / elements.length) * 100);

  return {
    pourcentage,
    elements,
    manquants: elements.filter((e) => !e.fait),
    complet: pourcentage === 100,
  };
}
