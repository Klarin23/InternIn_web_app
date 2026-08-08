// Script de peuplement des tables de référence (compétences, centres d'intérêt,
// objectifs de développement). Ces données sont gérées par la plateforme, pas
// par les utilisateurs — à exécuter une seule fois (ou après un reset de la base).

import "dotenv/config";
import { db } from "./index.js";
import {
  competences,
  centresInteret,
  objectifsDeveloppement,
} from "./schema.js";

const COMPETENCES = [
  // Techniques
  { nom: "JavaScript", typeCompetence: "technique" },
  { nom: "Python", typeCompetence: "technique" },
  { nom: "React", typeCompetence: "technique" },
  { nom: "Node.js", typeCompetence: "technique" },
  { nom: "SQL", typeCompetence: "technique" },
  { nom: "HTML / CSS", typeCompetence: "technique" },
  { nom: "Git", typeCompetence: "technique" },
  { nom: "Excel avancé", typeCompetence: "technique" },
  { nom: "Power BI", typeCompetence: "technique" },
  { nom: "Figma", typeCompetence: "technique" },
  { nom: "WordPress", typeCompetence: "technique" },
  { nom: "Analyse de données", typeCompetence: "technique" },
  // Professionnelles
  { nom: "Gestion de projet", typeCompetence: "professionnelle" },
  { nom: "Rédaction professionnelle", typeCompetence: "professionnelle" },
  { nom: "Prise de parole en public", typeCompetence: "professionnelle" },
  { nom: "Négociation", typeCompetence: "professionnelle" },
  { nom: "Service client", typeCompetence: "professionnelle" },
  { nom: "Analyse financière", typeCompetence: "professionnelle" },
  { nom: "Comptabilité générale", typeCompetence: "professionnelle" },
  { nom: "Recrutement", typeCompetence: "professionnelle" },
  { nom: "Marketing digital", typeCompetence: "professionnelle" },
  { nom: "Vente", typeCompetence: "professionnelle" },
  // Langues
  { nom: "Français", typeCompetence: "langue" },
  { nom: "Anglais", typeCompetence: "langue" },
  { nom: "Espagnol", typeCompetence: "langue" },
  { nom: "Arabe", typeCompetence: "langue" },
  { nom: "Portugais", typeCompetence: "langue" },
];

const CENTRES_INTERET = [
  "Génie Logiciel",
  "Marketing",
  "Comptabilité",
  "Gestion de Produit",
  "Support Client",
  "Vente",
  "Ressources Humaines",
  "Finance",
  "UI/UX Design",
  "Opérations",
  "Analyse de Données",
].map((nom) => ({ nom }));

const OBJECTIFS = [
  "Communication",
  "Leadership",
  "Travail d'équipe",
  "Gestion du temps",
  "Initiative",
  "Rédaction professionnelle",
  "Confiance en milieu professionnel",
  "Adaptabilité",
].map((nom) => ({ nom }));

async function seed() {
  const existingCompetences = await db.select().from(competences).limit(1);
  if (existingCompetences.length === 0) {
    await db.insert(competences).values(COMPETENCES);
    console.log(`✓ ${COMPETENCES.length} compétences insérées.`);
  } else {
    console.log("• Compétences déjà présentes, insertion ignorée.");
  }

  const existingCentres = await db.select().from(centresInteret).limit(1);
  if (existingCentres.length === 0) {
    await db.insert(centresInteret).values(CENTRES_INTERET);
    console.log(`✓ ${CENTRES_INTERET.length} centres d'intérêt insérés.`);
  } else {
    console.log("• Centres d'intérêt déjà présents, insertion ignorée.");
  }

  const existingObjectifs = await db
    .select()
    .from(objectifsDeveloppement)
    .limit(1);
  if (existingObjectifs.length === 0) {
    await db.insert(objectifsDeveloppement).values(OBJECTIFS);
    console.log(`✓ ${OBJECTIFS.length} objectifs de développement insérés.`);
  } else {
    console.log(
      "• Objectifs de développement déjà présents, insertion ignorée.",
    );
  }

  console.log("Seed terminé.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
