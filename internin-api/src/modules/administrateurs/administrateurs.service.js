import { eq, and, desc, gte, inArray, sql, ilike } from "drizzle-orm";
import { db } from "../../db/index.js";
import { creerNotification } from "../notifications/notifications.service.js";
import {
  entreprises,
  universites,
  administrateurs,
  offresFinales,
  entretiens,
  candidatures,
  offresStage,
  litigesReclamations,
  utilisateurs,
  documents,
  stagiaires,
  contactsEntreprise,
  parametresPlateforme,
} from "../../db/schema.js";

export async function listEntreprisesEnAttente() {
  return db
    .select()
    .from(entreprises)
    .where(eq(entreprises.statutVerification, "en_attente"));
}

const nbDocuments = sql`count(${documents.idDocument})`.mapWith(Number);

// Page de gestion complète "Entreprises" de la console admin (liste + filtre
// texte) — distincte de listEntreprisesEnAttente() qui n'alimente que la file
// de vérification. Renvoie, pour chaque entreprise, son statut de compte
// (utilisateurs.statutCompte) et son nombre de documents déposés.
export async function listToutesEntreprises(recherche) {
  const conditions = [];
  if (recherche) {
    conditions.push(ilike(entreprises.nomEntreprise, `%${recherche}%`));
  }

  const rows = await db
    .select({
      idEntreprise: entreprises.idEntreprise,
      idUtilisateur: entreprises.idUtilisateur,
      nomEntreprise: entreprises.nomEntreprise,
      logoUrl: entreprises.logoUrl,
      secteurActivite: entreprises.secteurActivite,
      tailleEntreprise: entreprises.tailleEntreprise,
      siteWeb: entreprises.siteWeb,
      linkedinUrl: entreprises.linkedinUrl,
      adresse: entreprises.adresse,
      aPropos: entreprises.aPropos,
      mission: entreprises.mission,
      cultureEntreprise: entreprises.cultureEntreprise,
      ville: entreprises.ville,
      pays: entreprises.pays,
      statutVerification: entreprises.statutVerification,
      dateVerification: entreprises.dateVerification,
      dateCreation: entreprises.dateCreation,
      email: utilisateurs.email,
      statutCompte: utilisateurs.statutCompte,
      nbDocuments,
    })
    .from(entreprises)
    .innerJoin(
      utilisateurs,
      eq(entreprises.idUtilisateur, utilisateurs.idUtilisateur),
    )
    .leftJoin(documents, eq(documents.idUtilisateur, entreprises.idUtilisateur))
    .where(conditions.length ? conditions[0] : undefined)
    .groupBy(
      entreprises.idEntreprise,
      entreprises.idUtilisateur,
      entreprises.nomEntreprise,
      entreprises.logoUrl,
      entreprises.secteurActivite,
      entreprises.tailleEntreprise,
      entreprises.siteWeb,
      entreprises.linkedinUrl,
      entreprises.adresse,
      entreprises.aPropos,
      entreprises.mission,
      entreprises.cultureEntreprise,
      entreprises.ville,
      entreprises.pays,
      entreprises.statutVerification,
      entreprises.dateVerification,
      entreprises.dateCreation,
      utilisateurs.email,
      utilisateurs.statutCompte,
    )
    .orderBy(entreprises.dateCreation);

  return rows;
}

// Documents déposés par l'entreprise (justificatifs Kbis, etc.) — consultés
// par l'admin dans le panneau de détail avant de valider/rejeter le compte.
export async function listDocumentsEntreprise(idEntreprise) {
  const [entreprise] = await db
    .select({ idUtilisateur: entreprises.idUtilisateur })
    .from(entreprises)
    .where(eq(entreprises.idEntreprise, idEntreprise));
  if (!entreprise) {
    const err = new Error("Entreprise introuvable");
    err.status = 404;
    throw err;
  }

  return db
    .select({
      idDocument: documents.idDocument,
      typeDocument: documents.typeDocument,
      nomFichier: documents.nomFichier,
      urlFichier: documents.urlFichier,
      dateUpload: documents.dateUpload,
    })
    .from(documents)
    .where(eq(documents.idUtilisateur, entreprise.idUtilisateur))
    .orderBy(desc(documents.dateUpload));
}

// Suspend ou réactive le compte d'une entreprise (agit sur statutCompte de
// l'utilisateur associé — distinct de statutVerification, qui reste inchangé).
export async function changerStatutCompteEntreprise(
  idEntreprise,
  statutCompte,
) {
  const [entreprise] = await db
    .select({ idUtilisateur: entreprises.idUtilisateur })
    .from(entreprises)
    .where(eq(entreprises.idEntreprise, idEntreprise));

  if (!entreprise) {
    const err = new Error("Entreprise introuvable");
    err.status = 404;
    throw err;
  }

  const [utilisateur] = await db
    .update(utilisateurs)
    .set({ statutCompte, dateMaj: new Date() })
    .where(eq(utilisateurs.idUtilisateur, entreprise.idUtilisateur))
    .returning();

  return utilisateur;
}

export async function listUniversitesEnAttente() {
  return db
    .select()
    .from(universites)
    .where(eq(universites.statutVerification, "en_attente"));
}

// Page de gestion complète "Universités" de la console admin (liste + filtre
// texte) — distincte de listUniversitesEnAttente() qui n'alimente que la
// file de vérification. Renvoie, pour chaque université, son statut de
// compte (utilisateurs.statutCompte) et son nombre de documents déposés.
export async function listToutesUniversites(recherche) {
  const conditions = [];
  if (recherche) {
    conditions.push(ilike(universites.nomUniversite, `%${recherche}%`));
  }

  const rows = await db
    .select({
      idUniversite: universites.idUniversite,
      idUtilisateur: universites.idUtilisateur,
      nomUniversite: universites.nomUniversite,
      emailOfficiel: universites.emailOfficiel,
      pays: universites.pays,
      statutVerification: universites.statutVerification,
      dateCreation: universites.dateCreation,
      statutCompte: utilisateurs.statutCompte,
      nbDocuments,
    })
    .from(universites)
    .innerJoin(
      utilisateurs,
      eq(universites.idUtilisateur, utilisateurs.idUtilisateur),
    )
    .leftJoin(documents, eq(documents.idUtilisateur, universites.idUtilisateur))
    .where(conditions.length ? conditions[0] : undefined)
    .groupBy(
      universites.idUniversite,
      universites.idUtilisateur,
      universites.nomUniversite,
      universites.emailOfficiel,
      universites.pays,
      universites.statutVerification,
      universites.dateCreation,
      utilisateurs.statutCompte,
    )
    .orderBy(universites.dateCreation);

  return rows;
}

// Suspend ou réactive le compte d'une université (agit sur statutCompte de
// l'utilisateur associé — distinct de statutVerification, qui reste inchangé).
export async function changerStatutCompteUniversite(
  idUniversite,
  statutCompte,
) {
  const [universite] = await db
    .select({ idUtilisateur: universites.idUtilisateur })
    .from(universites)
    .where(eq(universites.idUniversite, idUniversite));

  if (!universite) {
    const err = new Error("Université introuvable");
    err.status = 404;
    throw err;
  }

  const [utilisateur] = await db
    .update(utilisateurs)
    .set({ statutCompte, dateMaj: new Date() })
    .where(eq(utilisateurs.idUtilisateur, universite.idUtilisateur))
    .returning();

  return utilisateur;
}

export async function verifierEntreprise(
  idUtilisateurAdmin,
  idEntreprise,
  statutVerification,
) {
  const [admin] = await db
    .select()
    .from(administrateurs)
    .where(eq(administrateurs.idUtilisateur, idUtilisateurAdmin));

  if (!admin) {
    const err = new Error("Compte administrateur introuvable");
    err.status = 404;
    throw err;
  }

  const [entreprise] = await db
    .update(entreprises)
    .set({
      statutVerification,
      dateVerification: new Date(),
      adminVerificateurId: admin.idAdmin,
    })
    .where(eq(entreprises.idEntreprise, idEntreprise))
    .returning();

  if (!entreprise) {
    const err = new Error("Entreprise introuvable");
    err.status = 404;
    throw err;
  }

  await creerNotification({
    idUtilisateur: entreprise.idUtilisateur,
    type:
      statutVerification === "verifiee"
        ? "entreprise_verifiee"
        : "entreprise_rejetee",
    titre:
      statutVerification === "verifiee"
        ? "Entreprise vérifiée"
        : "Vérification refusée",
    message:
      statutVerification === "verifiee"
        ? "Votre entreprise a été vérifiée. Vous pouvez maintenant publier des offres de stage."
        : "Votre dossier de vérification n'a pas été validé. Contactez le support pour plus d'informations.",
    lien: "/offres-entreprise",
  });


  return entreprise;
}

export async function verifierUniversite(
  idUtilisateurAdmin,
  idUniversite,
  statutVerification,
) {
  const [universite] = await db
    .update(universites)
    .set({ statutVerification, dateVerification: new Date() })
    .where(eq(universites.idUniversite, idUniversite))
    .returning();

  if (!universite) {
    const err = new Error("Université introuvable");
    err.status = 404;
    throw err;
  }

  await creerNotification({
    idUtilisateur: universite.idUtilisateur,
    type:
      statutVerification === "verifiee"
        ? "universite_verifiee"
        : "universite_rejetee",
    titre:
      statutVerification === "verifiee"
        ? "Université vérifiée"
        : "Vérification refusée",
    message:
      statutVerification === "verifiee"
        ? "Votre établissement a été vérifié. Vous pouvez maintenant suivre vos étudiants."
        : "Votre dossier de vérification n'a pas été validé. Contactez le support pour plus d'informations.",
    lien: "/tableau-de-bord",
  });

  return universite;
}

// --- Page "Utilisateurs" de la console admin : vue unifiée des 3 types de
// comptes (stagiaire, entreprise, universite — les administrateurs eux-mêmes
// n'y figurent pas). Chaque sous-requête normalise ses champs vers la même
// forme { idUtilisateur, nom, email, role, organisation, emailVerifie,
// statutCompte, dateCreation } pour pouvoir être fusionnées puis triées.

async function fetchStagiairesUtilisateurs() {
  const rows = await db
    .select({
      idUtilisateur: stagiaires.idUtilisateur,
      prenom: stagiaires.prenom,
      nomFamille: stagiaires.nom,
      organisation: universites.nomUniversite,
      email: utilisateurs.email,
      emailVerifie: utilisateurs.emailVerifie,
      statutCompte: utilisateurs.statutCompte,
      dateCreation: utilisateurs.dateCreation,
    })
    .from(stagiaires)
    .innerJoin(
      utilisateurs,
      eq(stagiaires.idUtilisateur, utilisateurs.idUtilisateur),
    )
    .leftJoin(universites, eq(stagiaires.idUniversite, universites.idUniversite));

  return rows.map((r) => ({
    idUtilisateur: r.idUtilisateur,
    nom: `${r.prenom} ${r.nomFamille}`,
    email: r.email,
    role: "stagiaire",
    organisation: r.organisation || "—",
    emailVerifie: r.emailVerifie,
    statutCompte: r.statutCompte,
    dateCreation: r.dateCreation,
    statutVerification: null,
  }));
}

async function fetchEntreprisesUtilisateurs() {
  // Le "nom" affiché est celui du contact principal de l'entreprise (table
  // contacts_entreprise) — le nom de l'entreprise elle-même va dans
  // "organisation". Si aucun contact principal n'est renseigné, on retombe
  // sur le nom de l'entreprise.
  const rows = await db
    .select({
      idUtilisateur: entreprises.idUtilisateur,
      nomEntreprise: entreprises.nomEntreprise,
      contactNom: contactsEntreprise.nom,
      email: utilisateurs.email,
      emailVerifie: utilisateurs.emailVerifie,
      statutCompte: utilisateurs.statutCompte,
      dateCreation: utilisateurs.dateCreation,
      statutVerification: entreprises.statutVerification,
    })
    .from(entreprises)
    .innerJoin(
      utilisateurs,
      eq(entreprises.idUtilisateur, utilisateurs.idUtilisateur),
    )
    .leftJoin(
      contactsEntreprise,
      and(
        eq(contactsEntreprise.idEntreprise, entreprises.idEntreprise),
        eq(contactsEntreprise.estContactPrincipal, true),
      ),
    );

  return rows.map((r) => ({
    idUtilisateur: r.idUtilisateur,
    nom: r.contactNom || r.nomEntreprise,
    email: r.email,
    role: "entreprise",
    organisation: r.nomEntreprise,
    emailVerifie: r.emailVerifie,
    statutCompte: r.statutCompte,
    dateCreation: r.dateCreation,
    statutVerification: r.statutVerification,
  }));
}

async function fetchUniversitesUtilisateurs() {
  const rows = await db
    .select({
      idUtilisateur: universites.idUtilisateur,
      nomUniversite: universites.nomUniversite,
      nomCoordinateur: universites.nomCoordinateurStage,
      email: utilisateurs.email,
      emailVerifie: utilisateurs.emailVerifie,
      statutCompte: utilisateurs.statutCompte,
      dateCreation: utilisateurs.dateCreation,
    })
    .from(universites)
    .innerJoin(
      utilisateurs,
      eq(universites.idUtilisateur, utilisateurs.idUtilisateur),
    );

  return rows.map((r) => ({
    idUtilisateur: r.idUtilisateur,
    nom: r.nomCoordinateur || r.nomUniversite,
    email: r.email,
    role: "universite",
    organisation: r.nomUniversite,
    emailVerifie: r.emailVerifie,
    statutCompte: r.statutCompte,
    dateCreation: r.dateCreation,
  }));
}

export async function listTousUtilisateurs({ recherche, role } = {}) {
  const rolesVoulus = role
    ? [role]
    : ["stagiaire", "entreprise", "universite"];

  const [stagiairesRows, entreprisesRows, universitesRows] =
    await Promise.all([
      rolesVoulus.includes("stagiaire") ? fetchStagiairesUtilisateurs() : [],
      rolesVoulus.includes("entreprise") ? fetchEntreprisesUtilisateurs() : [],
      rolesVoulus.includes("universite") ? fetchUniversitesUtilisateurs() : [],
    ]);

  // Dédoublonnage par sécurité (ex. si un jour une entreprise avait deux
  // contacts principaux par erreur, on ne veut pas de ligne en double).
  const parId = new Map();
  for (const u of [...stagiairesRows, ...entreprisesRows, ...universitesRows]) {
    parId.set(u.idUtilisateur, u);
  }
  let tous = Array.from(parId.values());

  if (recherche) {
    const terme = recherche.toLowerCase();
    tous = tous.filter(
      (u) =>
        u.nom.toLowerCase().includes(terme) ||
        u.email.toLowerCase().includes(terme) ||
        u.organisation.toLowerCase().includes(terme),
    );
  }

  tous.sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation));
  return tous;
}

// Suspend ou réactive n'importe quel type de compte (agit directement sur
// utilisateurs.statutCompte via idUtilisateur — contrairement aux fonctions
// changerStatutCompteEntreprise/Universite ci-dessus qui partent d'un
// idEntreprise/idUniversite, celle-ci sert la page "Utilisateurs" qui
// mélange les 3 types de comptes).
export async function changerStatutCompteUtilisateur(idUtilisateurAdmin, idUtilisateur, statutCompte) {
  //Garde-fou: un admin ne doit jaais pouvoir modifier son propre statut
  //via cette route (risque d'auto-verrouillage accidentel ou non)
  if (idUtilisateur === idUtilisateurAdmin) {
    const err = new Error(
      "Vous ne pouvez pas modifier le statut de votre propre compte"
    );
    err.status = 400;
    throw err;
  }

  const [cible] = await db
    .select({ typeUtilisateur: utilisateurs.typeUtilisateur })
    .from(utilisateurs)
    .where(eq(utilisateurs.idUtilisateur, idUtilisateur));
  
  if (!cible) {
    const err = new Error("Utilisateur introuvable");
    err.status = 404;
    throw err;
  }

  //Garde-fou: cette route générique (page "utilisateur") ne doit pas
  //permettre de suspendre un autre compte administrateur sinon n'importe quel
  //admin (même à rôle limité) pourrait vérrouiller tous les autres
  //y compris le super admin sans recours simple

  if (cible.typeUtilisateur === "administrateur") {
    const err = new Error(
      "Impossible de modifier le statut d'un compte administrateur depuis cette page"
    );
    err.status = 403;
    throw err;
  }


  const [utilisateur] = await db
    .update(utilisateurs)
    .set({ statutCompte, dateMaj: new Date() })
    .where(eq(utilisateurs.idUtilisateur, idUtilisateur))
    .returning();

  

  return utilisateur;
}

export async function getAdminProfile(idUtilisateur) {
  const [admin] = await db
    .select({ nom: administrateurs.nom, roleAdmin: administrateurs.roleAdmin })
    .from(administrateurs)
    .where(eq(administrateurs.idUtilisateur, idUtilisateur));
  return admin || null;
}

const count = sql`count(*)`.mapWith(Number);

// Fusionne des évènements de sources hétérogènes (offres finales, entreprises,
// universités, signalements) en un flux d'activité unique trié par date.
// ⚠️ Ne couvre pas encore les suspensions de compte : aucune fonctionnalité
// de suspension n'existe pour l'instant côté Utilisateurs (à venir).
async function getActiviteRecente(limite = 8) {
  const [
    offresFinalesRecentes,
    entreprisesRecentes,
    universitesRecentes,
    litigesRecents,
  ] = await Promise.all([
    db
      .select({
        statut: offresFinales.statutValidationPlateforme,
        intitulePoste: offresFinales.intitulePoste,
        nomEntreprise: entreprises.nomEntreprise,
        date: offresFinales.dateValidation,
      })
      .from(offresFinales)
      .innerJoin(
        entretiens,
        eq(offresFinales.idEntretien, entretiens.idEntretien),
      )
      .innerJoin(
        candidatures,
        eq(entretiens.idCandidature, candidatures.idCandidature),
      )
      .innerJoin(offresStage, eq(candidatures.idOffre, offresStage.idOffre))
      .innerJoin(
        entreprises,
        eq(offresStage.idEntreprise, entreprises.idEntreprise),
      )
      .where(
        inArray(offresFinales.statutValidationPlateforme, [
          "approuve",
          "rejete",
        ]),
      )
      .orderBy(desc(offresFinales.dateValidation))
      .limit(limite),

    db
      .select({
        statut: entreprises.statutVerification,
        nom: entreprises.nomEntreprise,
        dateCreation: entreprises.dateCreation,
        dateVerification: entreprises.dateVerification,
      })
      .from(entreprises)
      .orderBy(desc(entreprises.dateCreation))
      .limit(limite),

    db
      .select({
        statut: universites.statutVerification,
        nom: universites.nomUniversite,
        dateCreation: universites.dateCreation,
        dateVerification: universites.dateVerification,
      })
      .from(universites)
      .orderBy(desc(universites.dateCreation))
      .limit(limite),

    db
      .select({
        typeLitige: litigesReclamations.typeLitige,
        description: litigesReclamations.description,
        date: litigesReclamations.dateCreation,
      })
      .from(litigesReclamations)
      .orderBy(desc(litigesReclamations.dateCreation))
      .limit(limite),
  ]);

  const evenements = [
    ...offresFinalesRecentes.map((o) => ({
      type: o.statut === "approuve" ? "offre_validee" : "offre_rejetee",
      titre: o.statut === "approuve" ? "Offre validée" : "Offre rejetée",
      sousTitre: `Stage ${o.intitulePoste} — ${o.nomEntreprise}`,
      date: o.date,
      tonalite: o.statut === "approuve" ? "success" : "danger",
    })),

    ...entreprisesRecentes.map((e) => {
      if (e.statut === "en_attente") {
        return {
          type: "entreprise_en_attente",
          titre: "Entreprise en attente",
          sousTitre: `${e.nom} — vérification requise`,
          date: e.dateCreation,
          tonalite: "warning",
        };
      }
      return {
        type:
          e.statut === "verifiee"
            ? "entreprise_verifiee"
            : "entreprise_rejetee",
        titre:
          e.statut === "verifiee"
            ? "Entreprise vérifiée"
            : "Entreprise rejetée",
        sousTitre: `${e.nom} — dossier ${e.statut === "verifiee" ? "complet" : "non conforme"}`,
        date: e.dateVerification || e.dateCreation,
        tonalite: e.statut === "verifiee" ? "verified" : "danger",
      };
    }),

    ...universitesRecentes.map((u) => {
      if (u.statut === "en_attente") {
        return {
          type: "universite_en_attente",
          titre: "Université en attente",
          sousTitre: `${u.nom} — vérification requise`,
          date: u.dateCreation,
          tonalite: "warning",
        };
      }
      return {
        type:
          u.statut === "verifiee"
            ? "universite_verifiee"
            : "universite_rejetee",
        titre:
          u.statut === "verifiee"
            ? "Université vérifiée"
            : "Université rejetée",
        sousTitre: `${u.nom} — dossier ${u.statut === "verifiee" ? "complet" : "non conforme"}`,
        date: u.dateVerification || u.dateCreation,
        tonalite: u.statut === "verifiee" ? "verified" : "danger",
      };
    }),

    ...litigesRecents.map((l) => ({
      type: "signalement_recu",
      titre: "Signalement reçu",
      sousTitre: l.typeLitige || l.description.slice(0, 60),
      date: l.date,
      tonalite: "warning",
    })),
  ].filter((e) => e.date);

  evenements.sort((a, b) => new Date(b.date) - new Date(a.date));
  return evenements.slice(0, limite);
}

export async function getStatsGlobales() {
  const debutMois = new Date();
  debutMois.setDate(1);
  debutMois.setHours(0, 0, 0, 0);

  const [
    entreprisesEnAttente,
    universitesEnAttente,
    [{ count: offresFinalesEnAttente }],
    repartitionOffres,
    [{ count: utilisateursActifs }],
    [{ count: nouveauxCeMois }],
    [{ count: signalementsOuverts }],
    activiteRecente,
  ] = await Promise.all([
    db
      .select()
      .from(entreprises)
      .where(eq(entreprises.statutVerification, "en_attente")),
    db
      .select()
      .from(universites)
      .where(eq(universites.statutVerification, "en_attente")),
    db
      .select({ count })
      .from(offresFinales)
      .where(eq(offresFinales.statutValidationPlateforme, "en_attente")),
    db
      .select({ statut: offresFinales.statutValidationPlateforme, count })
      .from(offresFinales)
      .groupBy(offresFinales.statutValidationPlateforme),
    db
      .select({ count })
      .from(utilisateurs)
      .where(eq(utilisateurs.statutCompte, "actif")),
    db
      .select({ count })
      .from(utilisateurs)
      .where(gte(utilisateurs.dateCreation, debutMois)),
    db
      .select({ count })
      .from(litigesReclamations)
      .where(eq(litigesReclamations.statut, "ouvert")),
    getActiviteRecente(),
  ]);

  const offresParStatut = repartitionOffres.reduce(
    (acc, r) => {
      if (r.statut === "approuve") acc.approuvees = r.count;
      if (r.statut === "en_attente") acc.enAttente = r.count;
      if (r.statut === "rejete") acc.rejetees = r.count;
      return acc;
    },
    { approuvees: 0, enAttente: 0, rejetees: 0 },
  );

  const actionsRequises =
    offresFinalesEnAttente +
    entreprisesEnAttente.length +
    universitesEnAttente.length +
    signalementsOuverts;

  return {
    offresEnAttente: offresFinalesEnAttente,
    entitesNonVerifiees: {
      total: entreprisesEnAttente.length + universitesEnAttente.length,
      universites: universitesEnAttente.length,
      entreprises: entreprisesEnAttente.length,
    },
    utilisateursActifs: {
      total: utilisateursActifs,
      nouveauxCeMois,
    },
    signalementsOuverts,
    offresParStatut,
    actionsRequises,
    activiteRecente,
  };
}

// Ligne unique de configuration globale (page "Paramètres" de la console
// admin). Créée avec les valeurs par défaut au premier appel si elle
// n'existe pas encore (aucun seed n'est nécessaire).
export async function getParametres() {
  const [existants] = await db.select().from(parametresPlateforme);
  if (existants) return existants;

  const [crees] = await db.insert(parametresPlateforme).values({}).returning();
  return crees;
}

export async function updateParametres(champs) {
  const parametres = await getParametres();

  const [maj] = await db
    .update(parametresPlateforme)
    .set({ ...champs, dateMaj: new Date() })
    .where(eq(parametresPlateforme.idParametres, parametres.idParametres))
    .returning();

  return maj;
}