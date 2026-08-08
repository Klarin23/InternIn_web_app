// Crée quelques offres de test rattachées à la première entreprise trouvée
// en base (celle que tu as créée pendant les tests de l'onboarding entreprise).
// À exécuter une seule fois pour avoir du contenu à afficher côté stagiaire,
// en attendant que le module "publier une offre" (côté entreprise) existe.

import "dotenv/config";
import { db } from "./index.js";
import { entreprises, offresStage } from "./schema.js";

const OFFRES_TEST = [
  {
    titre: "Stage Développeur Frontend",
    departement: "Ingénierie",
    secteurActivite: "Génie Logiciel",
    description:
      "Rejoignez notre équipe pour développer des interfaces modernes avec React et Next.js.",
    responsabilites:
      "Développer des composants UI, corriger des bugs, participer aux code reviews.",
    competencesRequises: "JavaScript, React, HTML/CSS",
    opportunitesApprentissage:
      "Encadrement par un développeur senior, méthodologie Agile.",
    modeTravail: "hybride",
    remunerationType: "allocation_mensuelle",
    montantRemuneration: "150.00",
    nombrePostes: 2,
    statut: "publie",
    datePublication: new Date(),
  },
  {
    titre: "Stage Marketing Digital",
    departement: "Marketing",
    secteurActivite: "Marketing",
    description:
      "Participez à la gestion des campagnes sur les réseaux sociaux et à la création de contenu.",
    responsabilites:
      "Gestion des réseaux sociaux, création de contenu, analyse de performance.",
    competencesRequises: "Marketing digital, réseaux sociaux",
    opportunitesApprentissage:
      "Formation aux outils d'analyse, mentorat marketing.",
    modeTravail: "distance",
    remunerationType: "indemnite_transport",
    nombrePostes: 1,
    statut: "publie",
    datePublication: new Date(),
  },
  {
    titre: "Stage Analyse de Données",
    departement: "Data",
    secteurActivite: "Analyse de Données",
    description:
      "Analysez des jeux de données pour produire des insights actionnables pour l'entreprise.",
    responsabilites:
      "Nettoyage de données, création de dashboards, présentation de résultats.",
    competencesRequises: "Excel avancé, SQL, Power BI",
    opportunitesApprentissage: "Encadrement par un data analyst senior.",
    modeTravail: "presentiel",
    remunerationType: "aucune",
    nombrePostes: 1,
    statut: "publie",
    datePublication: new Date(),
  },
];

async function seedOffres() {
  const [entreprise] = await db.select().from(entreprises).limit(1);

  if (!entreprise) {
    console.log(
      "⚠️ Aucune entreprise trouvée en base. Termine d'abord l'onboarding d'un compte entreprise, puis relance ce script.",
    );
    process.exit(1);
  }

  const existing = await db.select().from(offresStage).limit(1);
  if (existing.length > 0) {
    console.log("• Des offres existent déjà, insertion ignorée.");
    process.exit(0);
  }

  await db
    .insert(offresStage)
    .values(
      OFFRES_TEST.map((offre) => ({
        ...offre,
        idEntreprise: entreprise.idEntreprise,
      })),
    );

  console.log(
    `✓ ${OFFRES_TEST.length} offres de test créées pour "${entreprise.nomEntreprise}".`,
  );
  process.exit(0);
}

seedOffres().catch((err) => {
  console.error(err);
  process.exit(1);
});
