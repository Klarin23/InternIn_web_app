import { listScopesForRole } from "./adminRbac.js";
import { invalidateMaintenanceCache } from "../../middlewares/maintenance.middleware.js";
import { eq, and, or, desc, gte, inArray, sql, ilike } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  enrichWithDelaiTraitement,
  getDelaiTraitementHeures,
  computeDelaiMeta,
} from "../../utils/delaiTraitement.js";
import { invalidateEmailPreferenceCache } from "../../utils/email.js";
import { incrementerVersionJeton } from "../../utils/versionJeton.js";
import { creerNotification } from "../notifications/notifications.service.js";
import { logAdminAction } from "./auditAdmin.service.js";
import {
  entreprises,
  universites,
  administrateurs,
  offresFinales,
  entretiens,
  candidatures,
  offresStage,
  stages,
  litigesReclamations,
  utilisateurs,
  documents,
  stagiaires,
  contactsEntreprise,
  parametresPlateforme,
  sessionsUtilisateur,
  membresEquipe,
  partenariatsUniversiteEntreprise,
} from "../../db/schema.js";

export async function listEntreprisesEnAttente() {
  const rows = await db
    .select()
    .from(entreprises)
    .where(eq(entreprises.statutVerification, "en_attente"));
  return enrichWithDelaiTraitement(
    rows,
    (r) => r.dateCreation,
    () => true,
  );
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

  const nbOffresSql = sql`(
    select count(*)::int from offres_stage os
    where os.id_entreprise = ${entreprises.idEntreprise}
  )`.mapWith(Number);

  const nbStagesSql = sql`(
    select count(*)::int from stages st
    where st.id_entreprise = ${entreprises.idEntreprise}
  )`.mapWith(Number);

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
      motifRejetVerification: entreprises.motifRejetVerification,
      dateCreation: entreprises.dateCreation,
      email: utilisateurs.email,
      statutCompte: utilisateurs.statutCompte,
      nbDocuments,
      nbOffres: nbOffresSql,
      nbStages: nbStagesSql,
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
      entreprises.motifRejetVerification,
      entreprises.dateCreation,
      utilisateurs.email,
      utilisateurs.statutCompte,
    )
    .orderBy(entreprises.dateCreation);

  return enrichWithDelaiTraitement(
    rows,
    (r) => r.dateCreation,
    (r) => r.statutVerification === "en_attente",
  );
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

  // Toute modification de statut invalide les access JWT existants.
  // Le backend reste l'autorité sur suspension/révocation; le proxy web ne
  // fait qu'un contrôle précoce en consultant /auth/me.
  if (utilisateur) await incrementerVersionJeton(utilisateur.idUtilisateur);

  return utilisateur;
}

export async function listUniversitesEnAttente() {
  const rows = await db
    .select()
    .from(universites)
    .where(eq(universites.statutVerification, "en_attente"));
  return enrichWithDelaiTraitement(
    rows,
    (r) => r.dateCreation,
    () => true,
  );
}

// Page de gestion complète "Universités" de la console admin (liste + filtre
// texte) — distincte de listUniversitesEnAttente() qui n'alimente que la
// file de vérification. Renvoie, pour chaque université, son statut de
// compte (utilisateurs.statutCompte) et son nombre de documents déposés.
export async function listToutesUniversites(recherche) {
  const conditions = [];
  if (recherche) {
    const terme = `%${recherche}%`;
    conditions.push(
      or(
        ilike(universites.nomUniversite, terme),
        ilike(universites.emailOfficiel, terme),
        ilike(universites.pays, terme),
      ),
    );
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
    .orderBy(desc(universites.dateCreation));

  return enrichWithDelaiTraitement(
    rows,
    (r) => r.dateCreation,
    (r) => r.statutVerification === "en_attente",
  );
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

  // Une suspension/réactivation doit aussi invalider les JWT déjà émis.
  if (utilisateur) await incrementerVersionJeton(utilisateur.idUtilisateur);

  return utilisateur;
}

export async function verifierEntreprise(
  idUtilisateurAdmin,
  idEntreprise,
  statutVerification,
  { motif, commentaire } = {},
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

  const [avant] = await db
    .select({
      idEntreprise: entreprises.idEntreprise,
      statutVerification: entreprises.statutVerification,
      nomEntreprise: entreprises.nomEntreprise,
    })
    .from(entreprises)
    .where(eq(entreprises.idEntreprise, idEntreprise));

  if (!avant) {
    const err = new Error("Entreprise introuvable");
    err.status = 404;
    throw err;
  }

  // Motif obligatoire uniquement pour un rejet
  const motifClean =
    typeof motif === "string" && motif.trim() ? motif.trim() : null;
  const commentaireClean =
    typeof commentaire === "string" && commentaire.trim()
      ? commentaire.trim()
      : null;

  if (statutVerification === "rejetee" && (!motifClean || motifClean.length < 5)) {
    const err = new Error("Motif requis (min. 5 caractères) pour un rejet");
    err.status = 400;
    throw err;
  }

  // Autoriser le rejet même si déjà vérifiée (correction d'une validation accidentelle)
  // et la (re)validation si précédemment rejetée / en attente.
  const updatePayload = {
    statutVerification,
    dateVerification: new Date(),
    adminVerificateurId: admin.idAdmin,
  };

  if (statutVerification === "rejetee") {
    updatePayload.motifRejetVerification = motifClean;
  } else if (statutVerification === "verifiee") {
    // Effacer un éventuel motif de rejet précédent
    updatePayload.motifRejetVerification = null;
  }

  const [entreprise] = await db
    .update(entreprises)
    .set(updatePayload)
    .where(eq(entreprises.idEntreprise, idEntreprise))
    .returning();

  if (!entreprise) {
    const err = new Error("Entreprise introuvable");
    err.status = 404;
    throw err;
  }

  const isRejet = statutVerification === "rejetee";
  const messageRejet = motifClean
    ? `Votre dossier de vérification n'a pas été validé. Motif : ${motifClean}`
    : "Votre dossier de vérification n'a pas été validé. Contactez le support pour plus d'informations.";

  await creerNotification({
    idUtilisateur: entreprise.idUtilisateur,
    type: isRejet ? "entreprise_rejetee" : "entreprise_verifiee",
    titre: isRejet ? "Vérification refusée" : "Entreprise vérifiée",
    message: isRejet
      ? messageRejet
      : "Votre entreprise a été vérifiée. Vous pouvez maintenant publier des offres de stage.",
    lien: "/offres-entreprise",
  });

  await logAdminAction({
    idAdministrateur: idUtilisateurAdmin,
    typeEntite: "entreprise",
    idEntite: idEntreprise,
    action: isRejet ? "rejeter_entreprise" : "verifier_entreprise",
    ancienStatut: avant.statutVerification,
    nouveauStatut: statutVerification,
    motif: isRejet
      ? motifClean
      : commentaireClean || `Vérification de ${avant.nomEntreprise || idEntreprise}`,
  });

  return entreprise;
}

/**
 * Actions groupées sur les entreprises (vérifier / rejeter / suspendre / réactiver).
 * Traite chaque id indépendamment ; les échecs n'interrompent pas le lot.
 */
export async function actionsMasseEntreprises(
  idUtilisateurAdmin,
  { action, ids, motif } = {},
) {
  const actionsValides = ["verifier", "rejeter", "suspendre", "reactiver"];
  if (!actionsValides.includes(action)) {
    const err = new Error(
      `Action invalide (attendu : ${actionsValides.join(", ")})`,
    );
    err.status = 400;
    throw err;
  }

  const idList = Array.isArray(ids)
    ? [...new Set(ids.filter((id) => typeof id === "string" && id.length > 0))]
    : [];
  if (idList.length === 0) {
    const err = new Error("Aucune entreprise sélectionnée");
    err.status = 400;
    throw err;
  }
  if (idList.length > 100) {
    const err = new Error("Maximum 100 entreprises par action groupée");
    err.status = 400;
    throw err;
  }

  if (action === "rejeter") {
    const motifClean = typeof motif === "string" ? motif.trim() : "";
    if (motifClean.length < 5) {
      const err = new Error("Motif requis (min. 5 caractères) pour un rejet");
      err.status = 400;
      throw err;
    }
  }

  const resultats = [];
  let traitees = 0;
  let echecs = 0;

  for (const idEntreprise of idList) {
    try {
      if (action === "verifier") {
        await verifierEntreprise(idUtilisateurAdmin, idEntreprise, "verifiee");
      } else if (action === "rejeter") {
        await verifierEntreprise(idUtilisateurAdmin, idEntreprise, "rejetee", {
          motif: motif.trim(),
        });
      } else if (action === "suspendre") {
        await changerStatutCompteEntreprise(idEntreprise, "suspendu");
        await logAdminAction({
          idAdministrateur: idUtilisateurAdmin,
          typeEntite: "entreprise",
          idEntite: idEntreprise,
          action: "suspendre",
          nouveauStatut: "suspendu",
          motif: "Action groupée — suspension",
        });
      } else if (action === "reactiver") {
        await changerStatutCompteEntreprise(idEntreprise, "actif");
        await logAdminAction({
          idAdministrateur: idUtilisateurAdmin,
          typeEntite: "entreprise",
          idEntite: idEntreprise,
          action: "reactiver",
          nouveauStatut: "actif",
          motif: "Action groupée — réactivation",
        });
      }
      traitees += 1;
      resultats.push({ idEntreprise, ok: true });
    } catch (err) {
      echecs += 1;
      resultats.push({
        idEntreprise,
        ok: false,
        error: err?.message || "Erreur",
      });
    }
  }

  return { action, traitees, echecs, resultats };
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
      derniereConnexion: utilisateurs.derniereConnexion,
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
    derniereConnexion: r.derniereConnexion,
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
      derniereConnexion: utilisateurs.derniereConnexion,
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
    derniereConnexion: r.derniereConnexion,
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
      derniereConnexion: utilisateurs.derniereConnexion,
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
    derniereConnexion: r.derniereConnexion,
  }));
}


/**
 * Superviseurs = comptes utilisateurs type membre_entreprise
 * rattachés à membres_equipe avec roleEquipe = "superviseur"
 * et idUtilisateur non null (compte réellement activé).
 */
async function fetchSuperviseursUtilisateurs() {
  const rows = await db
    .select({
      idUtilisateur: utilisateurs.idUtilisateur,
      membreNom: membresEquipe.nom,
      email: utilisateurs.email,
      emailVerifie: utilisateurs.emailVerifie,
      statutCompte: utilisateurs.statutCompte,
      dateCreation: utilisateurs.dateCreation,
      derniereConnexion: utilisateurs.derniereConnexion,
      nomEntreprise: entreprises.nomEntreprise,
      idEntreprise: entreprises.idEntreprise,
      roleEquipe: membresEquipe.roleEquipe,
      statutMembre: membresEquipe.statutMembre,
      dateActivation: membresEquipe.dateActivation,
      dateEnvoiInvitation: membresEquipe.dateEnvoiInvitation,
    })
    .from(membresEquipe)
    .innerJoin(
      utilisateurs,
      eq(membresEquipe.idUtilisateur, utilisateurs.idUtilisateur),
    )
    .innerJoin(
      entreprises,
      eq(membresEquipe.idEntreprise, entreprises.idEntreprise),
    )
    .where(eq(membresEquipe.roleEquipe, "superviseur"));

  return rows.map((r) => ({
    idUtilisateur: r.idUtilisateur,
    nom: r.membreNom || r.email,
    email: r.email,
    role: "superviseur",
    organisation: r.nomEntreprise || "—",
    idEntreprise: r.idEntreprise,
    emailVerifie: r.emailVerifie,
    statutCompte: r.statutCompte,
    dateCreation: r.dateCreation,
    derniereConnexion: r.derniereConnexion,
    statutVerification: null,
    statutMembre: r.statutMembre,
    roleEquipe: r.roleEquipe,
    dateActivation: r.dateActivation,
    dateEnvoiInvitation: r.dateEnvoiInvitation,
  }));
}

export async function listTousUtilisateurs({ recherche, role, statut } = {}) {
  const rolesVoulus = role
    ? [role]
    : ["stagiaire", "entreprise", "universite", "superviseur"];

  const [stagiairesRows, entreprisesRows, universitesRows, superviseursRows] =
    await Promise.all([
      rolesVoulus.includes("stagiaire") ? fetchStagiairesUtilisateurs() : [],
      rolesVoulus.includes("entreprise") ? fetchEntreprisesUtilisateurs() : [],
      rolesVoulus.includes("universite") ? fetchUniversitesUtilisateurs() : [],
      rolesVoulus.includes("superviseur") ? fetchSuperviseursUtilisateurs() : [],
    ]);

  const parId = new Map();
  for (const u of [
    ...stagiairesRows,
    ...entreprisesRows,
    ...universitesRows,
    ...superviseursRows,
  ]) {
    parId.set(u.idUtilisateur, u);
  }
  let tous = Array.from(parId.values());

  if (statut) {
    tous = tous.filter((u) => u.statutCompte === statut);
  }

  if (recherche) {
    const terme = recherche.toLowerCase().trim();
    tous = tous.filter(
      (u) =>
        (u.nom || "").toLowerCase().includes(terme) ||
        (u.email || "").toLowerCase().includes(terme) ||
        (u.organisation || "").toLowerCase().includes(terme) ||
        (u.idUtilisateur || "").toLowerCase().includes(terme),
    );
  }

  tous.sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation));
  return tous;
}

/** KPI agrégés SQL — pas de données fictives. */
export async function getUtilisateursAdminStats() {
  const byType = await db
    .select({
      typeUtilisateur: utilisateurs.typeUtilisateur,
      count: sql`count(*)`.mapWith(Number),
    })
    .from(utilisateurs)
    .where(
      inArray(utilisateurs.typeUtilisateur, [
        "stagiaire",
        "entreprise",
        "universite",
      ]),
    )
    .groupBy(utilisateurs.typeUtilisateur);

  const byStatut = await db
    .select({
      statutCompte: utilisateurs.statutCompte,
      count: sql`count(*)`.mapWith(Number),
    })
    .from(utilisateurs)
    .where(
      inArray(utilisateurs.typeUtilisateur, [
        "stagiaire",
        "entreprise",
        "universite",
      ]),
    )
    .groupBy(utilisateurs.statutCompte);

  const [{ count: nonVerifies }] = await db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(utilisateurs)
    .where(
      and(
        inArray(utilisateurs.typeUtilisateur, [
          "stagiaire",
          "entreprise",
          "universite",
        ]),
        eq(utilisateurs.emailVerifie, false),
      ),
    );

  const typeMap = Object.fromEntries(
    (byType || []).map((r) => [r.typeUtilisateur, r.count]),
  );
  const statutMap = Object.fromEntries(
    (byStatut || []).map((r) => [r.statutCompte, r.count]),
  );

  const [{ count: nbSuperviseurs }] = await db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(membresEquipe)
    .innerJoin(
      utilisateurs,
      eq(membresEquipe.idUtilisateur, utilisateurs.idUtilisateur),
    )
    .where(eq(membresEquipe.roleEquipe, "superviseur"));

  const byStatutSup = await db
    .select({
      statutCompte: utilisateurs.statutCompte,
      count: sql`count(*)`.mapWith(Number),
    })
    .from(membresEquipe)
    .innerJoin(
      utilisateurs,
      eq(membresEquipe.idUtilisateur, utilisateurs.idUtilisateur),
    )
    .where(eq(membresEquipe.roleEquipe, "superviseur"))
    .groupBy(utilisateurs.statutCompte);

  for (const r of byStatutSup || []) {
    statutMap[r.statutCompte] = (statutMap[r.statutCompte] || 0) + (r.count || 0);
  }

  const total =
    (typeMap.stagiaire || 0) +
    (typeMap.entreprise || 0) +
    (typeMap.universite || 0) +
    (nbSuperviseurs || 0);

  return {
    total,
    actifs: statutMap.actif || 0,
    suspendus: statutMap.suspendu || 0,
    inactifs: statutMap.inactif || 0,
    stagiaires: typeMap.stagiaire || 0,
    entreprises: typeMap.entreprise || 0,
    universites: typeMap.universite || 0,
    superviseurs: nbSuperviseurs || 0,
    emailNonVerifie: nonVerifies || 0,
  };
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

  // Le changement de statut révoque immédiatement tous les access JWT
  // précédemment émis pour ce compte.
  if (utilisateur) await incrementerVersionJeton(utilisateur.idUtilisateur);

  try {
    await logAdminAction({
      idAdministrateur: idUtilisateurAdmin,
      action: `UTILISATEUR_STATUT_${String(statutCompte || "").toUpperCase()}`,
      typeEntite: "utilisateur",
      idEntite: idUtilisateur,
      motif: `type=${cible.typeUtilisateur};nouveau_statut=${statutCompte}`,
    });
  } catch {
    /* audit non bloquant */
  }

  return utilisateur;
}

export async function getAdminProfile(idUtilisateur) {
  const [admin] = await db
    .select({ nom: administrateurs.nom, roleAdmin: administrateurs.roleAdmin })
    .from(administrateurs)
    .where(eq(administrateurs.idUtilisateur, idUtilisateur));
  if (!admin) return null;
  return {
    ...admin,
    scopes: listScopesForRole(admin.roleAdmin),
  };
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

  // SLA : dossiers encore en attente au-delà du délai de traitement admin
  const delaiHeures = await getDelaiTraitementHeures();
  const [offresPendingRows] = await Promise.all([
    db
      .select({ dateCreation: offresFinales.dateCreation })
      .from(offresFinales)
      .where(eq(offresFinales.statutValidationPlateforme, "en_attente")),
  ]);
  const offresEnRetard = offresPendingRows.filter(
    (r) => computeDelaiMeta(r.dateCreation, delaiHeures, true).enRetard,
  ).length;
  const entreprisesEnRetard = entreprisesEnAttente.filter(
    (r) => computeDelaiMeta(r.dateCreation, delaiHeures, true).enRetard,
  ).length;
  const universitesEnRetard = universitesEnAttente.filter(
    (r) => computeDelaiMeta(r.dateCreation, delaiHeures, true).enRetard,
  ).length;

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
    delaiTraitementHeures: delaiHeures,
    dossiersEnRetard: {
      total: offresEnRetard + entreprisesEnRetard + universitesEnRetard,
      offresFinales: offresEnRetard,
      entreprises: entreprisesEnRetard,
      universites: universitesEnRetard,
    },
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

export async function updateParametres(champs, idUtilisateurAdmin = null) {
  const parametres = await getParametres();

  // Normaliser dates maintenance si présentes
  const payload = { ...champs };
  if ("maintenanceDebut" in payload) {
    payload.maintenanceDebut = payload.maintenanceDebut
      ? new Date(payload.maintenanceDebut)
      : null;
  }
  if ("maintenanceFin" in payload) {
    payload.maintenanceFin = payload.maintenanceFin
      ? new Date(payload.maintenanceFin)
      : null;
  }

  const [maj] = await db
    .update(parametresPlateforme)
    .set({ ...payload, dateMaj: new Date() })
    .where(eq(parametresPlateforme.idParametres, parametres.idParametres))
    .returning();

  // Appliquer immédiatement le flag e-mails transactionnels
  try {
    invalidateEmailPreferenceCache();
  } catch {
    /* ignore */
  }

  // Audit léger (console + journal si table présente)
  try {
    const keys = Object.keys(champs || {});
    if (idUtilisateurAdmin && keys.length) {
      // journal optionnel — ignore si non importé
      if (typeof journalActionsAdmin !== "undefined") {
        await db.insert(journalActionsAdmin).values({
          idAdministrateur: idUtilisateurAdmin,
          typeEntite: "parametres",
          idEntite: parametres.idParametres,
          action: "modification_parametres",
          ancienStatut: null,
          nouveauStatut: null,
          motif: keys.join(", "),
          dateCreation: new Date(),
        });
      }
    }
  } catch (_) {
    /* audit best-effort */
  }

  return maj;
}

async function resolveUserContext(idUtilisateur) {
  const [u] = await db
    .select({
      idUtilisateur: utilisateurs.idUtilisateur,
      email: utilisateurs.email,
      typeUtilisateur: utilisateurs.typeUtilisateur,
      emailVerifie: utilisateurs.emailVerifie,
      statutCompte: utilisateurs.statutCompte,
      derniereConnexion: utilisateurs.derniereConnexion,
      dateCreation: utilisateurs.dateCreation,
      dateMaj: utilisateurs.dateMaj,
    })
    .from(utilisateurs)
    .where(eq(utilisateurs.idUtilisateur, idUtilisateur));
  if (!u) {
    const err = new Error("Utilisateur introuvable");
    err.status = 404;
    throw err;
  }
  if (u.typeUtilisateur === "administrateur") {
    const err = new Error("Compte administrateur non géré sur cette page");
    err.status = 403;
    throw err;
  }
  return u;
}

export async function getUtilisateurAdminDetail(idUtilisateur) {
  const u = await resolveUserContext(idUtilisateur);
  let profil = null;
  let stats = {};

  if (u.typeUtilisateur === "stagiaire") {
    const [s] = await db
      .select({
        idStagiaire: stagiaires.idStagiaire,
        prenom: stagiaires.prenom,
        nom: stagiaires.nom,
        telephone: stagiaires.telephone,
        ville: stagiaires.ville,
        pays: stagiaires.pays,
        photoProfilUrl: stagiaires.photoProfilUrl,
        scoreCompletudeProfil: stagiaires.scoreCompletudeProfil,
        statutStage: stagiaires.statutStage,
        nomUniversite: universites.nomUniversite,
      })
      .from(stagiaires)
      .leftJoin(universites, eq(stagiaires.idUniversite, universites.idUniversite))
      .where(eq(stagiaires.idUtilisateur, idUtilisateur));
    profil = s || null;
    if (s) {
      const [[c], [st]] = await Promise.all([
        db
          .select({ count: sql`count(*)`.mapWith(Number) })
          .from(candidatures)
          .where(eq(candidatures.idStagiaire, s.idStagiaire)),
        db
          .select({ count: sql`count(*)`.mapWith(Number) })
          .from(stages)
          .where(eq(stages.idStagiaire, s.idStagiaire)),
      ]);
      stats = {
        nbCandidatures: c?.count ?? 0,
        nbStages: st?.count ?? 0,
        scoreCompletude: s.scoreCompletudeProfil ?? 0,
      };
    }
  } else if (u.typeUtilisateur === "entreprise") {
    const [e] = await db
      .select({
        idEntreprise: entreprises.idEntreprise,
        nomEntreprise: entreprises.nomEntreprise,
        secteurActivite: entreprises.secteurActivite,
        ville: entreprises.ville,
        pays: entreprises.pays,
        logoUrl: entreprises.logoUrl,
        statutVerification: entreprises.statutVerification,
      })
      .from(entreprises)
      .where(eq(entreprises.idUtilisateur, idUtilisateur));
    profil = e || null;
    if (e) {
      const [[o], [st]] = await Promise.all([
        db
          .select({ count: sql`count(*)`.mapWith(Number) })
          .from(offresStage)
          .where(eq(offresStage.idEntreprise, e.idEntreprise)),
        db
          .select({ count: sql`count(*)`.mapWith(Number) })
          .from(stages)
          .where(eq(stages.idEntreprise, e.idEntreprise)),
      ]);
      stats = { nbOffres: o?.count ?? 0, nbStages: st?.count ?? 0 };
    }
  } else if (u.typeUtilisateur === "universite") {
    const [uni] = await db
      .select({
        idUniversite: universites.idUniversite,
        nomUniversite: universites.nomUniversite,
        pays: universites.pays,
        statutVerification: universites.statutVerification,
      })
      .from(universites)
      .where(eq(universites.idUtilisateur, idUtilisateur));
    profil = uni || null;
  } else if (u.typeUtilisateur === "membre_entreprise") {
    const [m] = await db
      .select({
        idMembre: membresEquipe.idMembre,
        nom: membresEquipe.nom,
        emailMembre: membresEquipe.email,
        roleEquipe: membresEquipe.roleEquipe,
        statutMembre: membresEquipe.statutMembre,
        dateActivation: membresEquipe.dateActivation,
        dateEnvoiInvitation: membresEquipe.dateEnvoiInvitation,
        idEntreprise: entreprises.idEntreprise,
        nomEntreprise: entreprises.nomEntreprise,
      })
      .from(membresEquipe)
      .innerJoin(
        entreprises,
        eq(membresEquipe.idEntreprise, entreprises.idEntreprise),
      )
      .where(eq(membresEquipe.idUtilisateur, idUtilisateur))
      .limit(1);
    profil = m
      ? {
          ...m,
          isSuperviseur: m.roleEquipe === "superviseur",
        }
      : null;
  }

  return { ...u, profil, stats };
}

export async function listUtilisateurDocumentsAdmin(idUtilisateur) {
  await resolveUserContext(idUtilisateur);
  return db
    .select({
      idDocument: documents.idDocument,
      typeDocument: documents.typeDocument,
      nomFichier: documents.nomFichier,
      urlFichier: documents.urlFichier,
      dateUpload: documents.dateUpload,
    })
    .from(documents)
    .where(eq(documents.idUtilisateur, idUtilisateur))
    .orderBy(desc(documents.dateUpload));
}

export async function listUtilisateurCandidaturesAdmin(idUtilisateur) {
  const u = await resolveUserContext(idUtilisateur);
  if (u.typeUtilisateur !== "stagiaire") return [];
  const [s] = await db
    .select({ idStagiaire: stagiaires.idStagiaire })
    .from(stagiaires)
    .where(eq(stagiaires.idUtilisateur, idUtilisateur));
  if (!s) return [];
  return db
    .select({
      idCandidature: candidatures.idCandidature,
      statut: candidatures.statut,
      dateCandidature: candidatures.dateCandidature,
      titreOffre: offresStage.titre,
      nomEntreprise: entreprises.nomEntreprise,
    })
    .from(candidatures)
    .innerJoin(offresStage, eq(candidatures.idOffre, offresStage.idOffre))
    .innerJoin(entreprises, eq(offresStage.idEntreprise, entreprises.idEntreprise))
    .where(eq(candidatures.idStagiaire, s.idStagiaire))
    .orderBy(desc(candidatures.dateCandidature));
}

export async function listUtilisateurStagesAdmin(idUtilisateur) {
  const u = await resolveUserContext(idUtilisateur);
  if (u.typeUtilisateur === "stagiaire") {
    const [s] = await db
      .select({ idStagiaire: stagiaires.idStagiaire })
      .from(stagiaires)
      .where(eq(stagiaires.idUtilisateur, idUtilisateur));
    if (!s) return [];
    return db
      .select({
        idStage: stages.idStage,
        statut: stages.statut,
        dateDebut: stages.dateDebut,
        dateFinPrevue: stages.dateFinPrevue,
        nomEntreprise: entreprises.nomEntreprise,
      })
      .from(stages)
      .innerJoin(entreprises, eq(stages.idEntreprise, entreprises.idEntreprise))
      .where(eq(stages.idStagiaire, s.idStagiaire))
      .orderBy(desc(stages.dateDebut));
  }
  if (u.typeUtilisateur === "entreprise") {
    const [e] = await db
      .select({ idEntreprise: entreprises.idEntreprise })
      .from(entreprises)
      .where(eq(entreprises.idUtilisateur, idUtilisateur));
    if (!e) return [];
    return db
      .select({
        idStage: stages.idStage,
        statut: stages.statut,
        dateDebut: stages.dateDebut,
        dateFinPrevue: stages.dateFinPrevue,
        prenom: stagiaires.prenom,
        nom: stagiaires.nom,
      })
      .from(stages)
      .innerJoin(stagiaires, eq(stages.idStagiaire, stagiaires.idStagiaire))
      .where(eq(stages.idEntreprise, e.idEntreprise))
      .orderBy(desc(stages.dateDebut));
  }
  return [];
}

export async function listUtilisateurSignalementsAdmin(idUtilisateur) {
  await resolveUserContext(idUtilisateur);
  // Signalements où l'utilisateur est plaignant
  return db
    .select({
      idLitige: litigesReclamations.idLitige,
      typeLitige: litigesReclamations.typeLitige,
      description: litigesReclamations.description,
      statut: litigesReclamations.statut,
      dateCreation: litigesReclamations.dateCreation,
      dateResolution: litigesReclamations.dateResolution,
    })
    .from(litigesReclamations)
    .where(eq(litigesReclamations.idUtilisateurPlaignant, idUtilisateur))
    .orderBy(desc(litigesReclamations.dateCreation));
}

export async function listUtilisateurSessionsAdmin(idUtilisateur) {
  await resolveUserContext(idUtilisateur);
  return db
    .select({
      idSession: sessionsUtilisateur.idSession,
      adresseIp: sessionsUtilisateur.adresseIp,
      dateExpiration: sessionsUtilisateur.dateExpiration,
      dateCreation: sessionsUtilisateur.dateCreation,
    })
    .from(sessionsUtilisateur)
    .where(eq(sessionsUtilisateur.idUtilisateur, idUtilisateur))
    .orderBy(desc(sessionsUtilisateur.dateCreation));
}


// ---------------------------------------------------------------------------
// Détail admin entreprise — stats & listes (compteurs + onglets)
// ---------------------------------------------------------------------------

async function assertEntrepriseExists(idEntreprise) {
  const [row] = await db
    .select({ idEntreprise: entreprises.idEntreprise })
    .from(entreprises)
    .where(eq(entreprises.idEntreprise, idEntreprise));
  if (!row) {
    const err = new Error("Entreprise introuvable");
    err.status = 404;
    throw err;
  }
  return row;
}

/** Compteurs agrégés pour le panneau détail admin. */
export async function getEntrepriseAdminStats(idEntreprise) {
  await assertEntrepriseExists(idEntreprise);

  const [[offres], [stagesRow], [membres], [partenariats], [signalements], [docs]] =
    await Promise.all([
      db
        .select({ count: sql`count(*)`.mapWith(Number) })
        .from(offresStage)
        .where(eq(offresStage.idEntreprise, idEntreprise)),
      db
        .select({ count: sql`count(*)`.mapWith(Number) })
        .from(stages)
        .where(eq(stages.idEntreprise, idEntreprise)),
      db
        .select({ count: sql`count(*)`.mapWith(Number) })
        .from(membresEquipe)
        .where(eq(membresEquipe.idEntreprise, idEntreprise)),
      db
        .select({ count: sql`count(*)`.mapWith(Number) })
        .from(partenariatsUniversiteEntreprise)
        .where(eq(partenariatsUniversiteEntreprise.idEntreprise, idEntreprise)),
      db
        .select({ count: sql`count(*)`.mapWith(Number) })
        .from(litigesReclamations)
        .innerJoin(stages, eq(litigesReclamations.idStage, stages.idStage))
        .where(eq(stages.idEntreprise, idEntreprise)),
      db
        .select({
          count: sql`count(*)`.mapWith(Number),
        })
        .from(documents)
        .innerJoin(
          entreprises,
          eq(documents.idUtilisateur, entreprises.idUtilisateur),
        )
        .where(eq(entreprises.idEntreprise, idEntreprise)),
    ]);

  // Répartition des offres par statut (utile pour le détail)
  const offresParStatutRows = await db
    .select({
      statut: offresStage.statut,
      count: sql`count(*)`.mapWith(Number),
    })
    .from(offresStage)
    .where(eq(offresStage.idEntreprise, idEntreprise))
    .groupBy(offresStage.statut);

  const offresParStatut = Object.fromEntries(
    (offresParStatutRows || []).map((r) => [r.statut, r.count]),
  );

  return {
    nbOffres: offres?.count ?? 0,
    nbStages: stagesRow?.count ?? 0,
    nbMembres: membres?.count ?? 0,
    nbPartenariats: partenariats?.count ?? 0,
    nbSignalements: signalements?.count ?? 0,
    nbDocuments: docs?.count ?? 0,
    offresParStatut,
  };
}

/** Liste des offres de stage d'une entreprise (onglet Offres). */
export async function listEntrepriseOffresAdmin(idEntreprise) {
  await assertEntrepriseExists(idEntreprise);

  return db
    .select({
      idOffre: offresStage.idOffre,
      titre: offresStage.titre,
      departement: offresStage.departement,
      secteurActivite: offresStage.secteurActivite,
      modeTravail: offresStage.modeTravail,
      remunerationType: offresStage.remunerationType,
      statut: offresStage.statut,
      datePublication: offresStage.datePublication,
      dateLimiteCandidature: offresStage.dateLimiteCandidature,
      dureeStage: offresStage.dureeStage,
      nombrePostes: offresStage.nombrePostes,
      dateCreation: offresStage.dateCreation,
    })
    .from(offresStage)
    .where(eq(offresStage.idEntreprise, idEntreprise))
    .orderBy(desc(offresStage.dateCreation));
}

/** Liste des stages liés à l'entreprise. */
export async function listEntrepriseStagesAdmin(idEntreprise) {
  await assertEntrepriseExists(idEntreprise);

  return db
    .select({
      idStage: stages.idStage,
      dateDebut: stages.dateDebut,
      dateFinPrevue: stages.dateFinPrevue,
      dateFinReelle: stages.dateFinReelle,
      statut: stages.statut,
      progressionPourcentage: stages.progressionPourcentage,
      prenom: stagiaires.prenom,
      nom: stagiaires.nom,
      dateCreation: stages.dateCreation,
    })
    .from(stages)
    .innerJoin(stagiaires, eq(stages.idStagiaire, stagiaires.idStagiaire))
    .where(eq(stages.idEntreprise, idEntreprise))
    .orderBy(desc(stages.dateCreation));
}

/** Membres d'équipe de l'entreprise. */
export async function listEntrepriseEquipeAdmin(idEntreprise) {
  await assertEntrepriseExists(idEntreprise);

  return db
    .select({
      idMembre: membresEquipe.idMembre,
      roleEquipe: membresEquipe.roleEquipe,
      estAdminPrincipal: membresEquipe.estAdminPrincipal,
      statutMembre: membresEquipe.statutMembre,
      email: utilisateurs.email,
      dateCreation: membresEquipe.dateCreation,
    })
    .from(membresEquipe)
    .leftJoin(
      utilisateurs,
      eq(membresEquipe.idUtilisateur, utilisateurs.idUtilisateur),
    )
    .where(eq(membresEquipe.idEntreprise, idEntreprise))
    .orderBy(desc(membresEquipe.dateCreation));
}

/** Partenariats université ↔ entreprise. */
export async function listEntreprisePartenariatsAdmin(idEntreprise) {
  await assertEntrepriseExists(idEntreprise);

  return db
    .select({
      idPartenariat: partenariatsUniversiteEntreprise.idPartenariat,
      statut: partenariatsUniversiteEntreprise.statut,
      dateCreation: partenariatsUniversiteEntreprise.dateEnvoi,
      nomUniversite: universites.nomUniversite,
      idUniversite: universites.idUniversite,
    })
    .from(partenariatsUniversiteEntreprise)
    .leftJoin(
      universites,
      eq(partenariatsUniversiteEntreprise.idUniversite, universites.idUniversite),
    )
    .where(eq(partenariatsUniversiteEntreprise.idEntreprise, idEntreprise))
    .orderBy(desc(partenariatsUniversiteEntreprise.dateEnvoi));
}

/** Signalements / litiges liés à l'entreprise. */
export async function listEntrepriseSignalementsAdmin(idEntreprise) {
  await assertEntrepriseExists(idEntreprise);

  return db
    .select({
      idLitige: litigesReclamations.idLitige,
      type: litigesReclamations.typeLitige,
      statut: litigesReclamations.statut,
      description: litigesReclamations.description,
      dateCreation: litigesReclamations.dateCreation,
      idStage: litigesReclamations.idStage,
    })
    .from(litigesReclamations)
    .innerJoin(stages, eq(litigesReclamations.idStage, stages.idStage))
    .where(eq(stages.idEntreprise, idEntreprise))
    .orderBy(desc(litigesReclamations.dateCreation));
}
