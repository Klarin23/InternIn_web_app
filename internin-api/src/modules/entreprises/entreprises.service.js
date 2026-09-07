// Même principe que stagiaires.service.js : tout se fait dans une seule
// transaction pour ne jamais laisser un profil entreprise à moitié créé.

import { eq, and, getTableColumns } from "drizzle-orm";
import { db } from "../../db/index.js";
import { resolveEntrepriseContextOrThrow } from "../equipe/equipe.permissions.js";
import {
  utilisateurs,
  entreprises,
  contactsEntreprise,
} from "../../db/schema.js";
import {
  isAutoValidationEnabled,
  ELEMENT_ENTREPRISES,
} from "../../utils/autoValidation.js";

export async function completeEntrepriseOnboarding(idUtilisateur, payload) {
  // Défense en profondeur : ne jamais faire confiance au seul middleware de route.
  // Un stagiaire ne doit pas pouvoir créer un profil entreprises même si la route
  // était appelée depuis un autre handler.
  const [user] = await db
    .select({
      typeUtilisateur: utilisateurs.typeUtilisateur,
      statutCompte: utilisateurs.statutCompte,
    })
    .from(utilisateurs)
    .where(eq(utilisateurs.idUtilisateur, idUtilisateur))
    .limit(1);

  if (!user) {
    const err = new Error("Utilisateur introuvable");
    err.status = 404;
    throw err;
  }

  if (user.typeUtilisateur !== "entreprise") {
    console.warn(
      "[SECURITY] ENTERPRISE_ONBOARDING_DENIED",
      JSON.stringify({
        idUtilisateur,
        typeUtilisateur: user.typeUtilisateur,
      }),
    );
    const err = new Error("Accès non autorisé pour ce rôle");
    err.status = 403;
    throw err;
  }

  // Un profil entreprise ne peut être créé qu'une seule fois par compte.
  const [existing] = await db
    .select({ idEntreprise: entreprises.idEntreprise })
    .from(entreprises)
    .where(eq(entreprises.idUtilisateur, idUtilisateur))
    .limit(1);
  if (existing) {
    const err = new Error("Profil entreprise déjà créé");
    err.status = 409;
    throw err;
  }

  // Ignorer toute tentative d'auto-attribution de rôle via le body.
  if (payload && Object.prototype.hasOwnProperty.call(payload, "typeUtilisateur")) {
    delete payload.typeUtilisateur;
  }

  const autoVerif = await isAutoValidationEnabled(ELEMENT_ENTREPRISES);
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
        statutVerification: autoVerif ? "verifiee" : "en_attente",
        dateVerification: autoVerif ? new Date() : null,
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
  // Propriétaire uniquement : une ligne entreprises + typeUtilisateur=entreprise.
  // Un stagiaire avec une ligne orpheline ne doit pas obtenir le profil.
  const [entreprise] = await db
    .select({
      ...getTableColumns(entreprises),
      email: utilisateurs.email,
      typeUtilisateur: utilisateurs.typeUtilisateur,
    })
    .from(entreprises)
    .innerJoin(
      utilisateurs,
      eq(entreprises.idUtilisateur, utilisateurs.idUtilisateur),
    )
    .where(eq(entreprises.idUtilisateur, idUtilisateur));

  if (!entreprise || entreprise.typeUtilisateur !== "entreprise") {
    if (entreprise && entreprise.typeUtilisateur !== "entreprise") {
      console.warn(
        "[SECURITY] ENTERPRISE_CONTEXT_ACCESS_DENIED",
        JSON.stringify({
          idUtilisateur,
          typeUtilisateur: entreprise.typeUtilisateur,
          reason: "getEntrepriseProfile_type_mismatch",
        }),
      );
    }
    const err = new Error("Profil entreprise introuvable");
    err.status = 404;
    throw err;
  }
  // Ne pas exposer typeUtilisateur dans la réponse profil
  delete entreprise.typeUtilisateur;

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
    champsManquants: champsManquants.map((c) => c.champ),
  };
}

export async function updateEntrepriseProfile(idUtilisateur, payload) {
  const { entreprise: ctxEnt } = await resolveEntrepriseContextOrThrow(idUtilisateur);
  const [entreprise] = await db
    .update(entreprises)
    .set(payload)
    .where(eq(entreprises.idEntreprise, ctxEnt.idEntreprise))
    .returning();

  if (!entreprise) {
    const err = new Error("Profil entreprise introuvable");
    err.status = 404;
    throw err;
  }
  return entreprise;
}

export async function updateEntrepriseLogo(idUtilisateur, logoUrl) {
  const { entreprise: ctxEnt } = await resolveEntrepriseContextOrThrow(idUtilisateur);
  const [entreprise] = await db
    .update(entreprises)
    .set({ logoUrl })
    .where(eq(entreprises.idEntreprise, ctxEnt.idEntreprise))
    .returning();

  if (!entreprise) {
    const err = new Error("Profil entreprise introuvable");
    err.status = 404;
    throw err;
  }
  return entreprise;
}