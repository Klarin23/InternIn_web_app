import { sql } from "drizzle-orm";
import fs from "node:fs/promises";
import path from "node:path";
import { db } from "../../db/index.js";

const DELETE_CONFIRMATION = "SUPPRIMER";
const UPLOAD_ROOT = path.resolve("uploads");

function resolveSafeUploadFile(value) {
  if (!value || typeof value !== "string") return null;
  let pathname = value.split("?")[0].split("#")[0];
  try {
    if (/^https?:\/\//i.test(pathname)) pathname = new URL(pathname).pathname;
  } catch {
    return null;
  }
  const uploadMatch = pathname.match(/^\/uploads\/(.+)$/i);
  const downloadMatch = pathname.match(/^\/documents\/download\/(.+)$/i);
  const relative = uploadMatch?.[1] || downloadMatch?.[1];
  if (!relative) return null;
  const filePath = path.resolve(UPLOAD_ROOT, relative);
  const rootWithSep = `${UPLOAD_ROOT}${path.sep}`;
  if (!filePath.startsWith(rootWithSep)) return null;
  return filePath;
}

async function cleanupFilesAfterCommit(filesToDelete, conventionIds) {
  const paths = new Set();
  for (const value of filesToDelete) {
    const filePath = resolveSafeUploadFile(value);
    if (filePath) paths.add(filePath);
  }
  for (const id of conventionIds) {
    for (const locale of ["fr", "en"]) {
      paths.add(path.resolve(UPLOAD_ROOT, "conventions", `${id}-${locale}.pdf`));
    }
  }
  for (const filePath of paths) {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if (error?.code !== "ENOENT") {
        console.warn("[account-deletion] Impossible de supprimer un fichier :", filePath, error?.message);
      }
    }
  }
}

function inList(column, values) {
  if (!values.length) return sql`FALSE`;
  return sql`${sql.raw(column)} IN (${sql.join(values.map((value) => sql`${value}`), sql`, `)})`;
}

function rows(result) {
  return result?.rows || [];
}

function unique(values) {
  return [...new Set(values.filter(Boolean).map(String))];
}

/**
 * Supprime définitivement le compte d'un stagiaire et les données dont il
 * est propriétaire, dans une seule transaction PostgreSQL.
 *
 * Important : l'identifiant provient exclusivement de req.user. Cette
 * fonction ne permet jamais de supprimer un compte arbitraire fourni par le
 * client.
 */
export async function deleteStagiaireAccount(idUtilisateur, confirmation) {
  if (confirmation !== DELETE_CONFIRMATION) {
    const error = new Error("Confirmation de suppression invalide.");
    error.status = 400;
    error.code = "DELETE_CONFIRMATION_INVALID";
    throw error;
  }

  const filesToDelete = new Set();
  const conventionIds = [];

  await db.transaction(async (tx) => {
    const userResult = await tx.execute(sql`
      SELECT id_utilisateur, email, type_utilisateur
      FROM utilisateurs
      WHERE id_utilisateur = ${idUtilisateur}
      FOR UPDATE
    `);
    const user = rows(userResult)[0];

    if (!user) {
      const error = new Error("Compte introuvable.");
      error.status = 404;
      error.code = "ACCOUNT_NOT_FOUND";
      throw error;
    }

    if (user.type_utilisateur !== "stagiaire") {
      const error = new Error("Cette opération est réservée aux comptes stagiaires.");
      error.status = 403;
      error.code = "STUDENT_ACCOUNT_REQUIRED";
      throw error;
    }

    const stagiaireResult = await tx.execute(sql`
      SELECT id_stagiaire, cv_url, photo_profil_url
      FROM stagiaires
      WHERE id_utilisateur = ${idUtilisateur}
      FOR UPDATE
    `);
    const stagiaire = rows(stagiaireResult)[0];

    if (!stagiaire) {
      const error = new Error("Profil stagiaire introuvable.");
      error.status = 409;
      error.code = "STUDENT_PROFILE_NOT_FOUND";
      throw error;
    }

    const idStagiaire = stagiaire.id_stagiaire;

    // Fichiers directement attachés au profil.
    if (stagiaire.cv_url) filesToDelete.add(stagiaire.cv_url);
    if (stagiaire.photo_profil_url) filesToDelete.add(stagiaire.photo_profil_url);

    const documentResult = await tx.execute(sql`
      SELECT url_fichier FROM documents WHERE id_utilisateur = ${idUtilisateur}
    `);
    for (const row of rows(documentResult)) {
      if (row.url_fichier) filesToDelete.add(row.url_fichier);
    }

    // Collecte des identifiants de la chaîne candidature → entretien → offre
    // finale → convention → stage avant toute suppression de parent.
    const candidatureResult = await tx.execute(sql`
      SELECT id_candidature
      FROM candidatures
      WHERE id_stagiaire = ${idStagiaire}
    `);
    const candidatureIds = unique(rows(candidatureResult).map((r) => r.id_candidature));

    const propositionResult = await tx.execute(sql`
      SELECT id_proposition
      FROM propositions_stage
      WHERE id_stagiaire = ${idStagiaire}
    `);
    const propositionIds = unique(rows(propositionResult).map((r) => r.id_proposition));

    const entretienResult = await tx.execute(sql`
      SELECT id_entretien
      FROM entretiens
      WHERE id_candidature IN (
        SELECT id_candidature FROM candidatures WHERE id_stagiaire = ${idStagiaire}
      )
    `);
    const entretienIds = unique(rows(entretienResult).map((r) => r.id_entretien));

    const offreFinaleResult = await tx.execute(sql`
      SELECT id_offre_finale
      FROM offres_finales
      WHERE id_entretien IN (
        SELECT id_entretien FROM entretiens
        WHERE id_candidature IN (
          SELECT id_candidature FROM candidatures WHERE id_stagiaire = ${idStagiaire}
        )
      )
    `);
    const offreFinaleIds = unique(rows(offreFinaleResult).map((r) => r.id_offre_finale));

    const conventionResult = await tx.execute(sql`
      SELECT id_convention
      FROM conventions_stage
      WHERE ${inList("id_offre_finale", offreFinaleIds)}
    `);
    conventionIds.push(...unique(rows(conventionResult).map((r) => r.id_convention)));

    const stageResult = await tx.execute(sql`
      SELECT id_stage
      FROM stages
      WHERE id_stagiaire = ${idStagiaire}
         OR id_convention IN (
           SELECT id_convention FROM conventions_stage
           WHERE ${inList("id_offre_finale", offreFinaleIds)}
         )
    `);
    const stageIds = unique(rows(stageResult).map((r) => r.id_stage));

    // Fichiers des litiges et certificats appartenant au compte.
    const litigeResult = await tx.execute(sql`
      SELECT id_litige
      FROM litiges_reclamations
      WHERE id_utilisateur_plaignant = ${idUtilisateur}
    `);
    const ownLitigeIds = unique(rows(litigeResult).map((r) => r.id_litige));

    const litigeFilesResult = await tx.execute(sql`
      SELECT nom_stockage
      FROM litiges_pieces_jointes
      WHERE id_uploader = ${idUtilisateur}
         OR ${inList("id_litige", ownLitigeIds)}
    `);
    for (const row of rows(litigeFilesResult)) {
      if (row.nom_stockage) filesToDelete.add(`/uploads/litiges/${row.nom_stockage}`);
    }

    const certResult = await tx.execute(sql`
      SELECT url_fichier
      FROM certificats
      WHERE ${inList("id_stage", stageIds)}
    `);
    for (const row of rows(certResult)) {
      if (row.url_fichier) filesToDelete.add(row.url_fichier);
    }

    // Les conversations sont liées au stage. On collecte aussi les fichiers
    // de leurs messages avant de supprimer la chaîne conversationnelle.
    const conversationResult = await tx.execute(sql`
      SELECT id_conversation
      FROM conversations
      WHERE ${inList("id_stage", stageIds)}
    `);
    const conversationIds = unique(rows(conversationResult).map((r) => r.id_conversation));

    const messageResult = await tx.execute(sql`
      SELECT id_message
      FROM messages
      WHERE id_expediteur = ${idUtilisateur}
         OR ${inList("id_conversation", conversationIds)}
    `);
    const messageIds = unique(rows(messageResult).map((r) => r.id_message));

    const messageFilesResult = await tx.execute(sql`
      SELECT url_fichier
      FROM pieces_jointes_message
      WHERE ${inList("id_message", messageIds)}
    `);
    for (const row of rows(messageFilesResult)) {
      if (row.url_fichier) filesToDelete.add(row.url_fichier);
    }

    // ------------------------------------------------------------------
    // Suppression des dépendances, du plus profond vers la racine.
    // ------------------------------------------------------------------

    await tx.execute(sql`DELETE FROM pieces_jointes_message WHERE ${inList("id_message", messageIds)}`);
    await tx.execute(sql`DELETE FROM messages WHERE ${inList("id_message", messageIds)}`);
    await tx.execute(sql`DELETE FROM conversations WHERE ${inList("id_conversation", conversationIds)}`);

    await tx.execute(sql`DELETE FROM coaching_ia_sessions WHERE ${inList("id_stage", stageIds)}`);
    await tx.execute(sql`DELETE FROM evaluations_hebdomadaires WHERE ${inList("id_stage", stageIds)}`);
    await tx.execute(sql`DELETE FROM taches_stage WHERE ${inList("id_stage", stageIds)}`);
    await tx.execute(sql`DELETE FROM objectifs_stage WHERE ${inList("id_stage", stageIds)}`);
    await tx.execute(sql`DELETE FROM competences_acquises_stage WHERE ${inList("id_stage", stageIds)}`);
    await tx.execute(sql`DELETE FROM observations_superviseur_stage WHERE ${inList("id_stage", stageIds)}`);
    await tx.execute(sql`DELETE FROM journal_stage WHERE ${inList("id_stage", stageIds)}`);
    await tx.execute(sql`DELETE FROM affectations_superviseur_stage WHERE ${inList("id_stage", stageIds)}`);
    await tx.execute(sql`DELETE FROM certificats WHERE ${inList("id_stage", stageIds)}`);
    await tx.execute(sql`DELETE FROM recommandations WHERE ${inList("id_stage", stageIds)}`);
    await tx.execute(sql`DELETE FROM badges WHERE ${inList("id_stage", stageIds)} OR id_stagiaire = ${idStagiaire}`);

    // Une réclamation appartenant à un autre utilisateur ne doit pas être
    // détruite uniquement parce qu'elle pointait vers le stage supprimé.
    await tx.execute(sql`
      UPDATE litiges_reclamations
      SET id_stage = NULL
      WHERE ${inList("id_stage", stageIds)}
        AND id_utilisateur_plaignant <> ${idUtilisateur}
    `);

    await tx.execute(sql`
      DELETE FROM litiges_messages
      WHERE id_auteur = ${idUtilisateur}
         OR ${inList("id_litige", ownLitigeIds)}
    `);
    await tx.execute(sql`
      DELETE FROM litiges_pieces_jointes
      WHERE id_uploader = ${idUtilisateur}
         OR ${inList("id_litige", ownLitigeIds)}
    `);
    await tx.execute(sql`DELETE FROM litiges_notes_internes WHERE ${inList("id_litige", ownLitigeIds)}`);
    await tx.execute(sql`DELETE FROM litiges_reclamations WHERE ${inList("id_litige", ownLitigeIds)}`);

    await tx.execute(sql`DELETE FROM stages WHERE ${inList("id_stage", stageIds)}`);
    await tx.execute(sql`DELETE FROM conventions_stage WHERE ${inList("id_convention", conventionIds)}`);
    await tx.execute(sql`DELETE FROM offres_finales WHERE ${inList("id_offre_finale", offreFinaleIds)}`);
    await tx.execute(sql`DELETE FROM entretiens WHERE ${inList("id_entretien", entretienIds)}`);

    await tx.execute(sql`DELETE FROM evaluations_candidature WHERE ${inList("id_candidature", candidatureIds)}`);
    await tx.execute(sql`DELETE FROM notes_candidature WHERE ${inList("id_candidature", candidatureIds)}`);
    await tx.execute(sql`DELETE FROM activites_equipe WHERE ${inList("id_candidature", candidatureIds)}`);
    await tx.execute(sql`DELETE FROM candidatures WHERE ${inList("id_candidature", candidatureIds)}`);
    await tx.execute(sql`DELETE FROM propositions_stage WHERE ${inList("id_proposition", propositionIds)}`);

    await tx.execute(sql`DELETE FROM ressources_consultees WHERE id_stagiaire = ${idStagiaire}`);
    await tx.execute(sql`DELETE FROM stagiaire_competences WHERE id_stagiaire = ${idStagiaire}`);
    await tx.execute(sql`DELETE FROM stagiaire_centres_interet WHERE id_stagiaire = ${idStagiaire}`);
    await tx.execute(sql`DELETE FROM stagiaire_objectifs_developpement WHERE id_stagiaire = ${idStagiaire}`);
    await tx.execute(sql`DELETE FROM formations WHERE id_stagiaire = ${idStagiaire}`);
    await tx.execute(sql`DELETE FROM disponibilites_stagiaire WHERE id_stagiaire = ${idStagiaire}`);
    await tx.execute(sql`DELETE FROM favoris_offres WHERE id_stagiaire = ${idStagiaire}`);

    // Données directement rattachées au compte utilisateur.
    await tx.execute(sql`DELETE FROM alertes_securite WHERE id_utilisateur_cible = ${idUtilisateur}`);
    await tx.execute(sql`DELETE FROM notifications WHERE id_utilisateur = ${idUtilisateur}`);
    await tx.execute(sql`DELETE FROM documents WHERE id_utilisateur = ${idUtilisateur}`);
    await tx.execute(sql`DELETE FROM verifications_email WHERE id_utilisateur = ${idUtilisateur}`);
    await tx.execute(sql`DELETE FROM tentatives_connexion WHERE id_utilisateur = ${idUtilisateur}`);
    await tx.execute(sql`DELETE FROM sessions_utilisateur WHERE id_utilisateur = ${idUtilisateur}`);
    await tx.execute(sql`DELETE FROM sse_tickets WHERE id_utilisateur = ${idUtilisateur}`);

    await tx.execute(sql`DELETE FROM stagiaires WHERE id_stagiaire = ${idStagiaire}`);

    const deleted = await tx.execute(sql`
      DELETE FROM utilisateurs
      WHERE id_utilisateur = ${idUtilisateur}
        AND type_utilisateur = 'stagiaire'
      RETURNING id_utilisateur, email
    `);

    if (!rows(deleted).length) {
      const error = new Error("Le compte stagiaire n'a pas pu être supprimé.");
      error.status = 409;
      error.code = "ACCOUNT_DELETE_CONFLICT";
      throw error;
    }
  });

  const finalConventionIds = [...new Set(conventionIds)];
  await cleanupFilesAfterCommit(filesToDelete, finalConventionIds);

  return {
    success: true,
    filesToDelete: [...filesToDelete],
    conventionIds: finalConventionIds,
  };
}



/**
 * Supprime définitivement le compte propriétaire d'une entreprise et les
 * données dont l'entreprise est propriétaire, dans une seule transaction.
 *
 * Les comptes des membres d'équipe ne sont PAS supprimés : seule leur
 * appartenance à l'entreprise est supprimée. Les données des stagiaires
 * restent également intactes ; seules les candidatures/propositions liées
 * aux offres supprimées et les stages de cette entreprise sont supprimés.
 */
export async function deleteEntrepriseAccount(idUtilisateur, confirmation) {
  if (confirmation !== DELETE_CONFIRMATION) {
    const error = new Error("Confirmation de suppression invalide.");
    error.status = 400;
    error.code = "DELETE_CONFIRMATION_INVALID";
    throw error;
  }

  const filesToDelete = new Set();
  const conventionIds = [];

  await db.transaction(async (tx) => {
    const userResult = await tx.execute(sql`
      SELECT id_utilisateur, email, type_utilisateur
      FROM utilisateurs
      WHERE id_utilisateur = ${idUtilisateur}
      FOR UPDATE
    `);
    const user = rows(userResult)[0];

    if (!user) {
      const error = new Error("Compte introuvable.");
      error.status = 404;
      error.code = "ACCOUNT_NOT_FOUND";
      throw error;
    }

    if (user.type_utilisateur !== "entreprise") {
      const error = new Error("Cette opération est réservée aux comptes entreprise.");
      error.status = 403;
      error.code = "COMPANY_ACCOUNT_REQUIRED";
      throw error;
    }

    const entrepriseResult = await tx.execute(sql`
      SELECT id_entreprise, id_utilisateur, logo_url
      FROM entreprises
      WHERE id_utilisateur = ${idUtilisateur}
      FOR UPDATE
    `);
    const entreprise = rows(entrepriseResult)[0];

    if (!entreprise) {
      const error = new Error("Profil entreprise introuvable.");
      error.status = 409;
      error.code = "COMPANY_PROFILE_NOT_FOUND";
      throw error;
    }

    if (entreprise.logo_url) filesToDelete.add(entreprise.logo_url);

    const idEntreprise = entreprise.id_entreprise;

    // Toutes les offres de l'entreprise sont collectées avant suppression.
    const offreResult = await tx.execute(sql`
      SELECT id_offre
      FROM offres_stage
      WHERE id_entreprise = ${idEntreprise}
    `);
    const offreIds = unique(rows(offreResult).map((r) => r.id_offre));

    // Candidatures liées aux offres de l'entreprise.
    const candidatureResult = await tx.execute(sql`
      SELECT id_candidature
      FROM candidatures
      WHERE ${inList("id_offre", offreIds)}
    `);
    const candidatureIds = unique(rows(candidatureResult).map((r) => r.id_candidature));

    // Entretiens -> offres finales -> conventions.
    const entretienResult = await tx.execute(sql`
      SELECT id_entretien
      FROM entretiens
      WHERE ${inList("id_candidature", candidatureIds)}
    `);
    const entretienIds = unique(rows(entretienResult).map((r) => r.id_entretien));

    const offreFinaleResult = await tx.execute(sql`
      SELECT id_offre_finale
      FROM offres_finales
      WHERE ${inList("id_entretien", entretienIds)}
    `);
    const offreFinaleIds = unique(rows(offreFinaleResult).map((r) => r.id_offre_finale));

    const conventionResult = await tx.execute(sql`
      SELECT id_convention
      FROM conventions_stage
      WHERE ${inList("id_offre_finale", offreFinaleIds)}
    `);
    conventionIds.push(...unique(rows(conventionResult).map((r) => r.id_convention)));

    // Tous les stages appartenant à l'entreprise, même si une convention
    // ancienne n'est plus reliée à une offre finale.
    const stageResult = await tx.execute(sql`
      SELECT id_stage
      FROM stages
      WHERE id_entreprise = ${idEntreprise}
         OR id_convention IN (
           SELECT id_convention
           FROM conventions_stage
           WHERE ${inList("id_offre_finale", offreFinaleIds)}
         )
    `);
    const stageIds = unique(rows(stageResult).map((r) => r.id_stage));

    // Inclure également toute convention portée directement par un stage
    // de cette entreprise afin de ne laisser aucune dépendance orpheline.
    const stageConventionResult = await tx.execute(sql`
      SELECT id_convention
      FROM stages
      WHERE ${inList("id_stage", stageIds)}
    `);
    conventionIds.push(...unique(rows(stageConventionResult).map((r) => r.id_convention)));

    // Fichiers directement rattachés au compte entreprise.
    const documentResult = await tx.execute(sql`
      SELECT url_fichier
      FROM documents
      WHERE id_utilisateur = ${idUtilisateur}
    `);
    for (const row of rows(documentResult)) {
      if (row.url_fichier) filesToDelete.add(row.url_fichier);
    }

    // Pièces des litiges dont le propriétaire du compte est le plaignant.
    const litigeResult = await tx.execute(sql`
      SELECT id_litige
      FROM litiges_reclamations
      WHERE id_utilisateur_plaignant = ${idUtilisateur}
    `);
    const ownLitigeIds = unique(rows(litigeResult).map((r) => r.id_litige));

    const litigeFilesResult = await tx.execute(sql`
      SELECT nom_stockage
      FROM litiges_pieces_jointes
      WHERE id_uploader = ${idUtilisateur}
         OR ${inList("id_litige", ownLitigeIds)}
    `);
    for (const row of rows(litigeFilesResult)) {
      if (row.nom_stockage) filesToDelete.add(`/uploads/litiges/${row.nom_stockage}`);
    }

    // Certificats des stages supprimés.
    const certResult = await tx.execute(sql`
      SELECT url_fichier
      FROM certificats
      WHERE ${inList("id_stage", stageIds)}
    `);
    for (const row of rows(certResult)) {
      if (row.url_fichier) filesToDelete.add(row.url_fichier);
    }

    // Conversations de ces stages et leurs pièces jointes.
    const conversationResult = await tx.execute(sql`
      SELECT id_conversation
      FROM conversations
      WHERE ${inList("id_stage", stageIds)}
         OR id_entreprise = ${idEntreprise}
    `);
    const conversationIds = unique(rows(conversationResult).map((r) => r.id_conversation));

    const messageResult = await tx.execute(sql`
      SELECT id_message
      FROM messages
      WHERE id_expediteur = ${idUtilisateur}
         OR ${inList("id_conversation", conversationIds)}
    `);
    const messageIds = unique(rows(messageResult).map((r) => r.id_message));

    const messageFilesResult = await tx.execute(sql`
      SELECT url_fichier
      FROM pieces_jointes_message
      WHERE ${inList("id_message", messageIds)}
    `);
    for (const row of rows(messageFilesResult)) {
      if (row.url_fichier) filesToDelete.add(row.url_fichier);
    }

    // ------------------------------------------------------------------
    // Suppression du plus profond vers la racine.
    // ------------------------------------------------------------------

    await tx.execute(sql`DELETE FROM pieces_jointes_message WHERE ${inList("id_message", messageIds)}`);
    await tx.execute(sql`DELETE FROM messages WHERE ${inList("id_message", messageIds)}`);
    await tx.execute(sql`DELETE FROM conversations WHERE ${inList("id_conversation", conversationIds)}`);

    await tx.execute(sql`DELETE FROM coaching_ia_sessions WHERE ${inList("id_stage", stageIds)}`);
    await tx.execute(sql`DELETE FROM evaluations_hebdomadaires WHERE ${inList("id_stage", stageIds)}`);
    await tx.execute(sql`DELETE FROM taches_stage WHERE ${inList("id_stage", stageIds)}`);
    await tx.execute(sql`DELETE FROM objectifs_stage WHERE ${inList("id_stage", stageIds)}`);
    await tx.execute(sql`DELETE FROM competences_acquises_stage WHERE ${inList("id_stage", stageIds)}`);
    await tx.execute(sql`DELETE FROM observations_superviseur_stage WHERE ${inList("id_stage", stageIds)}`);
    await tx.execute(sql`DELETE FROM journal_stage WHERE ${inList("id_stage", stageIds)}`);
    await tx.execute(sql`DELETE FROM affectations_superviseur_stage WHERE ${inList("id_stage", stageIds)}`);
    await tx.execute(sql`DELETE FROM certificats WHERE ${inList("id_stage", stageIds)}`);
    await tx.execute(sql`DELETE FROM recommandations WHERE ${inList("id_stage", stageIds)}`);
    await tx.execute(sql`DELETE FROM badges WHERE ${inList("id_stage", stageIds)}`);

    // Ne pas supprimer un litige appartenant à un autre utilisateur :
    // seulement détacher son stage si celui-ci disparaît.
    await tx.execute(sql`
      UPDATE litiges_reclamations
      SET id_stage = NULL
      WHERE ${inList("id_stage", stageIds)}
        AND id_utilisateur_plaignant <> ${idUtilisateur}
    `);

    await tx.execute(sql`
      DELETE FROM litiges_messages
      WHERE id_auteur = ${idUtilisateur}
         OR ${inList("id_litige", ownLitigeIds)}
    `);
    await tx.execute(sql`
      DELETE FROM litiges_pieces_jointes
      WHERE id_uploader = ${idUtilisateur}
         OR ${inList("id_litige", ownLitigeIds)}
    `);
    await tx.execute(sql`DELETE FROM litiges_notes_internes WHERE ${inList("id_litige", ownLitigeIds)}`);
    await tx.execute(sql`DELETE FROM litiges_reclamations WHERE ${inList("id_litige", ownLitigeIds)}`);

    await tx.execute(sql`DELETE FROM stages WHERE ${inList("id_stage", stageIds)}`);
    await tx.execute(sql`DELETE FROM conventions_stage WHERE ${inList("id_convention", conventionIds)}`);
    await tx.execute(sql`DELETE FROM offres_finales WHERE ${inList("id_offre_finale", offreFinaleIds)}`);
    await tx.execute(sql`DELETE FROM entretiens WHERE ${inList("id_entretien", entretienIds)}`);

    await tx.execute(sql`DELETE FROM evaluations_candidature WHERE ${inList("id_candidature", candidatureIds)}`);
    await tx.execute(sql`DELETE FROM notes_candidature WHERE ${inList("id_candidature", candidatureIds)}`);
    await tx.execute(sql`DELETE FROM activites_equipe WHERE id_entreprise = ${idEntreprise} OR ${inList("id_candidature", candidatureIds)}`);
    await tx.execute(sql`DELETE FROM propositions_stage WHERE id_entreprise = ${idEntreprise}`);
    await tx.execute(sql`DELETE FROM candidatures WHERE ${inList("id_candidature", candidatureIds)}`);

    // Les favoris liés aux offres sont déjà ON DELETE CASCADE dans le schéma.
    await tx.execute(sql`DELETE FROM offres_stage WHERE ${inList("id_offre", offreIds)}`);

    await tx.execute(sql`DELETE FROM partenariats_universite_entreprise WHERE id_entreprise = ${idEntreprise}`);
    await tx.execute(sql`DELETE FROM parametres_equipe_entreprise WHERE id_entreprise = ${idEntreprise}`);
    await tx.execute(sql`DELETE FROM preferences_notifications_entreprise WHERE id_entreprise = ${idEntreprise}`);

    // Les membres d'équipe peuvent être de vrais comptes utilisateurs :
    // on supprime uniquement leur rattachement à l'entreprise.
    await tx.execute(sql`DELETE FROM membres_equipe WHERE id_entreprise = ${idEntreprise}`);
    await tx.execute(sql`DELETE FROM contacts_entreprise WHERE id_entreprise = ${idEntreprise}`);

    await tx.execute(sql`DELETE FROM alertes_securite WHERE id_utilisateur_cible = ${idUtilisateur}`);
    await tx.execute(sql`DELETE FROM notifications WHERE id_utilisateur = ${idUtilisateur}`);
    await tx.execute(sql`DELETE FROM documents WHERE id_utilisateur = ${idUtilisateur}`);
    await tx.execute(sql`DELETE FROM verifications_email WHERE id_utilisateur = ${idUtilisateur}`);
    await tx.execute(sql`DELETE FROM tentatives_connexion WHERE id_utilisateur = ${idUtilisateur}`);
    await tx.execute(sql`DELETE FROM sessions_utilisateur WHERE id_utilisateur = ${idUtilisateur}`);
    await tx.execute(sql`DELETE FROM sse_tickets WHERE id_utilisateur = ${idUtilisateur}`);

    await tx.execute(sql`DELETE FROM entreprises WHERE id_entreprise = ${idEntreprise}`);

    const deleted = await tx.execute(sql`
      DELETE FROM utilisateurs
      WHERE id_utilisateur = ${idUtilisateur}
        AND type_utilisateur = 'entreprise'
      RETURNING id_utilisateur, email
    `);

    if (!rows(deleted).length) {
      const error = new Error("Le compte entreprise n'a pas pu être supprimé.");
      error.status = 409;
      error.code = "ACCOUNT_DELETE_CONFLICT";
      throw error;
    }
  });

  const finalConventionIds = [...new Set(conventionIds)];
  await cleanupFilesAfterCommit(filesToDelete, finalConventionIds);

  return {
    success: true,
    filesToDelete: [...filesToDelete],
    conventionIds: finalConventionIds,
  };
}
