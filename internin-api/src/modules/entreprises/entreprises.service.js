// Même principe que stagiaires.service.js : tout se fait dans une seule
// transaction pour ne jamais laisser un profil entreprise à moitié créé.

import { eq, and, getTableColumns } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  utilisateurs,
  entreprises,
  contactsEntreprise,
} from "../../db/schema.js";

export async function completeEntrepriseOnboarding(idUtilisateur, payload) {
  return db.transaction(async (tx) => {
    // 1. Création du profil entreprise
    const [entreprise] = await tx
      .insert(entreprises)
      .values({
        idUtilisateur,
        nomEntreprise: payload.nomEntreprise,
        logoUrl: payload.logoUrl || null,
        secteurActivite: payload.secteurActivite,
        tailleEntreprise: payload.tailleEntreprise,
        siteWeb: payload.siteWeb || null,
        linkedinUrl: payload.linkedinUrl || null,
        pays: payload.pays,
        ville: payload.ville,
        aPropos: payload.aPropos,
        mission: payload.mission || null,
        cultureEntreprise: payload.cultureEntreprise || null,
        // Toute nouvelle entreprise démarre "en_attente" : un administrateur
        // devra la vérifier avant qu'elle puisse publier des offres (cf. PRD)
        statutVerification: "en_attente",
      })
      .returning();

    // 2. Contact principal, marqué comme tel automatiquement
    await tx.insert(contactsEntreprise).values({
      idEntreprise: entreprise.idEntreprise,
      nom: payload.contactNom,
      fonction: payload.contactFonction,
      email: payload.contactEmail,
      telephone: payload.contactTelephone,
      estContactPrincipal: true,
      peutEtreSuperviseur: payload.peutEtreSuperviseur ?? true,
    });

    // 3. Le compte passe de "inactif" à "actif" — l'onboarding est terminé,
    // même si la vérification admin (statutVerification) reste à faire séparément
    await tx
      .update(utilisateurs)
      .set({ statutCompte: "actif", dateMaj: new Date() })
      .where(eq(utilisateurs.idUtilisateur, idUtilisateur));

    return entreprise;
  });
}

const CHAMPS_COMPLETUDE = [
  { champ: "logoUrl", label: "votre logo" },
  { champ: "secteurActivite", label: "votre secteur d'activité" },
  { champ: "tailleEntreprise", label: "la taille de l'entreprise" },
  { champ: "siteWeb", label: "votre site web" },
  { champ: "adresse", label: "votre adresse" },
  { champ: "aPropos", label: "une description de l'entreprise" },
];

export async function getEntrepriseProfile(idUtilisateur) {
  const [entreprise] = await db
    .select({
      ...getTableColumns(entreprises),
      email: utilisateurs.email,
    })
    .from(entreprises)
    .innerJoin(
      utilisateurs,
      eq(entreprises.idUtilisateur, utilisateurs.idUtilisateur),
    )
    .where(eq(entreprises.idUtilisateur, idUtilisateur));

  if (!entreprise) {
    const err = new Error("Profil entreprise introuvable");
    err.status = 404;
    throw err;
  }

  const [contactPrincipal] = await db
    .select({ telephone: contactsEntreprise.telephone })
    .from(contactsEntreprise)
    .where(
      and(
        eq(contactsEntreprise.idEntreprise, entreprise.idEntreprise),
        eq(contactsEntreprise.estContactPrincipal, true),
      ),
    );

  const champsManquants = CHAMPS_COMPLETUDE.filter((c) => !entreprise[c.champ]);
  const scoreCompletude = Math.round(
    ((CHAMPS_COMPLETUDE.length - champsManquants.length) /
      CHAMPS_COMPLETUDE.length) *
      100,
  );

  return {
    ...entreprise,
    telephone: contactPrincipal?.telephone || null,
    scoreCompletude,
    champsManquants: champsManquants.map((c) => c.label),
  };
}

export async function updateEntrepriseProfile(idUtilisateur, payload) {
  const [entreprise] = await db
    .update(entreprises)
    .set(payload)
    .where(eq(entreprises.idUtilisateur, idUtilisateur))
    .returning();

  if (!entreprise) {
    const err = new Error("Profil entreprise introuvable");
    err.status = 404;
    throw err;
  }
  return entreprise;
}

export async function updateEntrepriseLogo(idUtilisateur, logoUrl) {
  const [entreprise] = await db
    .update(entreprises)
    .set({ logoUrl })
    .where(eq(entreprises.idUtilisateur, idUtilisateur))
    .returning();

  if (!entreprise) {
    const err = new Error("Profil entreprise introuvable");
    err.status = 404;
    throw err;
  }
  return entreprise;
}