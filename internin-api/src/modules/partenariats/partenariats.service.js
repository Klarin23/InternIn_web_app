import { eq, and, ne, ilike, inArray } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  universites,
  entreprises,
  utilisateurs,
  stages,
  partenariatsUniversiteEntreprise,
} from "../../db/schema.js";
import { creerNotification } from "../notifications/notifications.service.js";

async function getUniversiteOrThrow(idUtilisateur) {
  const [universite] = await db
    .select()
    .from(universites)
    .where(eq(universites.idUtilisateur, idUtilisateur));
  if (!universite) {
    const err = new Error("Profil université introuvable");
    err.status = 404;
    throw err;
  }
  return universite;
}

async function getEntrepriseOrThrow(idUtilisateur) {
  const [entreprise] = await db
    .select()
    .from(entreprises)
    .where(eq(entreprises.idUtilisateur, idUtilisateur));
  if (!entreprise) {
    const err = new Error("Profil entreprise introuvable");
    err.status = 404;
    throw err;
  }
  return entreprise;
}

// Page "Découvrir des entreprises" côté université : liste les entreprises
// vérifiées par la plateforme, avec le statut de partenariat déjà existant
// (le cas échéant) pour que l'université ne renvoie pas une invitation en
// double par erreur.
export async function listEntreprisesDecouvrir(idUtilisateur, recherche) {
  const universite = await getUniversiteOrThrow(idUtilisateur);

  const conditions = [eq(entreprises.statutVerification, "verifiee")];
  if (recherche) {
    conditions.push(ilike(entreprises.nomEntreprise, `%${recherche}%`));
  }

  const entreprisesRows = await db
    .select({
      idEntreprise: entreprises.idEntreprise,
      nomEntreprise: entreprises.nomEntreprise,
      secteurActivite: entreprises.secteurActivite,
      ville: entreprises.ville,
      logoUrl: entreprises.logoUrl,
    })
    .from(entreprises)
    .where(and(...conditions));

  const partenariatsRows = await db
    .select({
      idEntreprise: partenariatsUniversiteEntreprise.idEntreprise,
      idPartenariat: partenariatsUniversiteEntreprise.idPartenariat,
      statut: partenariatsUniversiteEntreprise.statut,
    })
    .from(partenariatsUniversiteEntreprise)
    .where(
      eq(
        partenariatsUniversiteEntreprise.idUniversite,
        universite.idUniversite,
      ),
    );
  const partenariatParEntreprise = new Map(
    partenariatsRows.map((p) => [p.idEntreprise, p]),
  );

  return entreprisesRows.map((e) => ({
    ...e,
    partenariat: partenariatParEntreprise.get(e.idEntreprise) || null,
  }));
}

// Envoi (ou renvoi après refus) d'une invitation de partenariat.
export async function envoyerInvitation(idUtilisateur, idEntreprise, message) {
  const universite = await getUniversiteOrThrow(idUtilisateur);

  const [entreprise] = await db
    .select({
      idEntreprise: entreprises.idEntreprise,
      idUtilisateur: entreprises.idUtilisateur,
      statutVerification: entreprises.statutVerification,
    })
    .from(entreprises)
    .where(eq(entreprises.idEntreprise, idEntreprise));
  if (!entreprise) {
    const err = new Error("Entreprise introuvable");
    err.status = 404;
    throw err;
  }
  if (entreprise.statutVerification !== "verifiee") {
    const err = new Error(
      "Seules les entreprises vérifiées par la plateforme peuvent être invitées",
    );
    err.status = 400;
    throw err;
  }

  const [existant] = await db
    .select()
    .from(partenariatsUniversiteEntreprise)
    .where(
      and(
        eq(
          partenariatsUniversiteEntreprise.idUniversite,
          universite.idUniversite,
        ),
        eq(partenariatsUniversiteEntreprise.idEntreprise, idEntreprise),
      ),
    );

  if (existant && existant.statut !== "refusee") {
    const err = new Error(
      existant.statut === "acceptee"
        ? "Cette entreprise est déjà partenaire"
        : "Une invitation est déjà en attente de réponse pour cette entreprise",
    );
    err.status = 409;
    throw err;
  }

  // Une invitation précédemment refusée peut être renvoyée : on remet la
  // même ligne à "en_attente" plutôt que d'en créer une seconde (contrainte
  // d'unicité idUniversite+idEntreprise).
  if (existant) {
    const [maj] = await db
      .update(partenariatsUniversiteEntreprise)
      .set({
        statut: "en_attente",
        messageInvitation: message || null,
        dateEnvoi: new Date(),
        dateReponse: null,
      })
      .where(
        eq(
          partenariatsUniversiteEntreprise.idPartenariat,
          existant.idPartenariat,
        ),
      )
      .returning();

    await creerNotification({
      idUtilisateur: entreprise.idUtilisateur,
      type: "partenariat_invitation",
      titre: "Invitation de partenariat",
      message: `${universite.nomUniversite} vous invite à devenir partenaire.`,
      lien: "/partenariats-universites",
    });

    return maj;
  }

  const [cree] = await db
    .insert(partenariatsUniversiteEntreprise)
    .values({
      idUniversite: universite.idUniversite,
      idEntreprise,
      messageInvitation: message || null,
    })
    .returning();

  await creerNotification({
    idUtilisateur: entreprise.idUtilisateur,
    type: "partenariat_invitation",
    titre: "Invitation de partenariat",
    message: `${universite.nomUniversite} vous invite à devenir partenaire.`,
    lien: "/partenariats-universites",
  });

  return cree;
}

// Invitations reçues par une entreprise, en attente de réponse.
export async function listInvitationsRecues(idUtilisateur) {
  const entreprise = await getEntrepriseOrThrow(idUtilisateur);

  return db
    .select({
      idPartenariat: partenariatsUniversiteEntreprise.idPartenariat,
      statut: partenariatsUniversiteEntreprise.statut,
      messageInvitation: partenariatsUniversiteEntreprise.messageInvitation,
      dateEnvoi: partenariatsUniversiteEntreprise.dateEnvoi,
      idUniversite: universites.idUniversite,
      nomUniversite: universites.nomUniversite,
      logoUrl: universites.logoUrl,
      pays: universites.pays,
      typeEtablissement: universites.typeEtablissement,
    })
    .from(partenariatsUniversiteEntreprise)
    .innerJoin(
      universites,
      eq(
        partenariatsUniversiteEntreprise.idUniversite,
        universites.idUniversite,
      ),
    )
    .where(
      and(
        eq(
          partenariatsUniversiteEntreprise.idEntreprise,
          entreprise.idEntreprise,
        ),
        eq(partenariatsUniversiteEntreprise.statut, "en_attente"),
      ),
    );
}

// L'entreprise accepte ou refuse une invitation reçue.
export async function repondreInvitation(
  idUtilisateur,
  idPartenariat,
  accepter,
) {
  const entreprise = await getEntrepriseOrThrow(idUtilisateur);

  const [partenariat] = await db
    .select()
    .from(partenariatsUniversiteEntreprise)
    .where(eq(partenariatsUniversiteEntreprise.idPartenariat, idPartenariat));

  if (!partenariat || partenariat.idEntreprise !== entreprise.idEntreprise) {
    const err = new Error("Invitation introuvable");
    err.status = 404;
    throw err;
  }
  if (partenariat.statut !== "en_attente") {
    const err = new Error("Cette invitation a déjà reçu une réponse");
    err.status = 400;
    throw err;
  }

  const [maj] = await db
    .update(partenariatsUniversiteEntreprise)
    .set({
      statut: accepter ? "acceptee" : "refusee",
      dateReponse: new Date(),
    })
    .where(eq(partenariatsUniversiteEntreprise.idPartenariat, idPartenariat))
    .returning();

  const [universite] = await db
    .select({ idUtilisateur: universites.idUtilisateur })
    .from(universites)
    .where(eq(universites.idUniversite, partenariat.idUniversite));

  if (universite) {
    await creerNotification({
      idUtilisateur: universite.idUtilisateur,
      type: accepter ? "partenariat_accepte" : "partenariat_refuse",
      titre: accepter ? "Partenariat accepté" : "Invitation déclinée",
      message: accepter
        ? `${entreprise.nomEntreprise} a accepté votre invitation de partenariat.`
        : `${entreprise.nomEntreprise} a décliné votre invitation de partenariat.`,
      lien: "/entreprises-universite",
    });
  }

  return maj;
}

// Espace "Partenaires" côté entreprise : universités dont l'invitation a
// été acceptée, avec le nombre d'étudiants déjà placés pour cette université
// le cas échéant (0 si le partenariat est encore récent, sans stage démarré).
export async function listUniversitesPartenaires(idUtilisateur) {
  const entreprise = await getEntrepriseOrThrow(idUtilisateur);

  const partenariatsRows = await db
    .select({
      idPartenariat: partenariatsUniversiteEntreprise.idPartenariat,
      dateReponse: partenariatsUniversiteEntreprise.dateReponse,
      idUniversite: universites.idUniversite,
      nomUniversite: universites.nomUniversite,
      logoUrl: universites.logoUrl,
      pays: universites.pays,
      typeEtablissement: universites.typeEtablissement,
    })
    .from(partenariatsUniversiteEntreprise)
    .innerJoin(
      universites,
      eq(
        partenariatsUniversiteEntreprise.idUniversite,
        universites.idUniversite,
      ),
    )
    .where(
      and(
        eq(
          partenariatsUniversiteEntreprise.idEntreprise,
          entreprise.idEntreprise,
        ),
        eq(partenariatsUniversiteEntreprise.statut, "acceptee"),
      ),
    );

  if (partenariatsRows.length === 0) return [];

  const idsUniversites = partenariatsRows.map((p) => p.idUniversite);
  const stagesRows = await db
    .select({ idUniversite: stages.idUniversite, statut: stages.statut })
    .from(stages)
    .where(
      and(
        eq(stages.idEntreprise, entreprise.idEntreprise),
        inArray(stages.idUniversite, idsUniversites),
      ),
    );

  const statsParUniversite = new Map();
  for (const s of stagesRows) {
    const agg = statsParUniversite.get(s.idUniversite) || {
      nbEtudiants: 0,
      stagesActifs: 0,
    };
    agg.nbEtudiants += 1;
    if (s.statut === "actif") agg.stagesActifs += 1;
    statsParUniversite.set(s.idUniversite, agg);
  }

  return partenariatsRows.map((p) => ({
    ...p,
    nbEtudiants: statsParUniversite.get(p.idUniversite)?.nbEtudiants || 0,
    stagesActifs: statsParUniversite.get(p.idUniversite)?.stagesActifs || 0,
  }));
}

// Invitations envoyées par l'université, quel que soit leur statut — pour
// afficher "en attente" / "refusée" à côté de la liste "Découvrir".
export async function listInvitationsEnvoyees(idUtilisateur) {
  const universite = await getUniversiteOrThrow(idUtilisateur);

  return db
    .select({
      idPartenariat: partenariatsUniversiteEntreprise.idPartenariat,
      idEntreprise: partenariatsUniversiteEntreprise.idEntreprise,
      statut: partenariatsUniversiteEntreprise.statut,
      dateEnvoi: partenariatsUniversiteEntreprise.dateEnvoi,
      dateReponse: partenariatsUniversiteEntreprise.dateReponse,
    })
    .from(partenariatsUniversiteEntreprise)
    .where(
      eq(
        partenariatsUniversiteEntreprise.idUniversite,
        universite.idUniversite,
      ),
    );
}
