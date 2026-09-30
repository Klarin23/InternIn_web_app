import { createHash, randomBytes } from "node:crypto";
import { and, desc, eq, or, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  utilisateurs,
  stagiaires,
  universites,
  rattachementsUniversitaires,
  codesRattachementUniversite,
  liensRattachementUniversite,
  journalRattachementsUniversitaire,
} from "../../db/schema.js";
import { creerNotification } from "../notifications/notifications.service.js";
import { sendUniversiteStudentInvitationEmail } from "../../utils/email.js";

const INVITATION_TTL_MS = 48 * 60 * 60 * 1000;
const CODE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const LINK_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function hashSecret(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function generateSecret(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

function generateInstitutionCode() {
  return `IN-${randomBytes(8).toString("hex").toUpperCase()}`;
}

function rethrowDatabaseConflict(error) {
  if (error?.code === "23505") {
    const err = new Error(
      "Une demande de rattachement est déjà en cours pour cet étudiant.",
    );
    err.status = 409;
    throw err;
  }
  throw error;
}

function assertUuidLike(value, message = "Identifiant invalide") {
  if (typeof value !== "string" || !/^[0-9a-f-]{36}$/i.test(value)) {
    const err = new Error(message);
    err.status = 400;
    throw err;
  }
}

async function getUniversityOrThrow(idUtilisateur) {
  const [universite] = await db
    .select()
    .from(universites)
    .where(eq(universites.idUtilisateur, idUtilisateur))
    .limit(1);

  if (!universite) {
    const err = new Error("Profil université introuvable");
    err.status = 404;
    throw err;
  }
  return universite;
}

function assertUniversityCanUseFeature(universite) {
  if (universite.statutVerification !== "verifiee") {
    const err = new Error(
      "Votre établissement doit être vérifié avant d'utiliser le rattachement des étudiants.",
    );
    err.status = 403;
    throw err;
  }
}

async function journaliser(
  executor,
  { idUniversite, idRattachement = null, idStagiaire = null, idUtilisateurActeur = null, action, metadata = null },
) {
  await executor.insert(journalRattachementsUniversitaire).values({
    idUniversite,
    idRattachement,
    idStagiaire,
    idUtilisateurActeur,
    action,
    metadata,
  });
}

async function getStudentByUserForUpdate(tx, idUtilisateur) {
  const rows = await tx
    .select({
      idStagiaire: stagiaires.idStagiaire,
      idUtilisateur: stagiaires.idUtilisateur,
      idUniversite: stagiaires.idUniversite,
      email: utilisateurs.email,
      emailVerifie: utilisateurs.emailVerifie,
    })
    .from(stagiaires)
    .innerJoin(
      utilisateurs,
      eq(utilisateurs.idUtilisateur, stagiaires.idUtilisateur),
    )
    .where(eq(stagiaires.idUtilisateur, idUtilisateur))
    .limit(1);

  if (!rows[0]) {
    const err = new Error("Profil stagiaire introuvable");
    err.status = 404;
    throw err;
  }

  await tx.execute(
    sql`SELECT id_stagiaire FROM stagiaires WHERE id_stagiaire = ${rows[0].idStagiaire} FOR UPDATE`,
  );

  const [student] = await tx
    .select({
      idStagiaire: stagiaires.idStagiaire,
      idUtilisateur: stagiaires.idUtilisateur,
      idUniversite: stagiaires.idUniversite,
      email: utilisateurs.email,
      emailVerifie: utilisateurs.emailVerifie,
    })
    .from(stagiaires)
    .innerJoin(
      utilisateurs,
      eq(utilisateurs.idUtilisateur, stagiaires.idUtilisateur),
    )
    .where(eq(stagiaires.idStagiaire, rows[0].idStagiaire))
    .limit(1);

  return student;
}

async function getPendingConflict(tx, idStagiaire) {
  const [existing] = await tx
    .select()
    .from(rattachementsUniversitaires)
    .where(
      and(
        eq(rattachementsUniversitaires.idStagiaire, idStagiaire),
        sql`${rattachementsUniversitaires.statut} IN ('en_attente', 'confirme')`,
      ),
    )
    .limit(1);
  return existing || null;
}

async function assertNoUniversityConflict(
  tx,
  student,
  targetUniversityId,
  ignoreRattachementId = null,
) {
  if (student.idUniversite) {
    const err = new Error(
      student.idUniversite === targetUniversityId
        ? "Cet étudiant est déjà rattaché à votre établissement."
        : "Cet étudiant est déjà rattaché à un autre établissement. Un changement d'université doit suivre le workflow prévu.",
    );
    err.status = 409;
    throw err;
  }

  const existing = await getPendingConflict(tx, student.idStagiaire);
  if (existing && existing.idRattachement !== ignoreRattachementId) {
    const err = new Error(
      "Cet étudiant possède déjà un rattachement universitaire actif ou une demande en cours.",
    );
    err.status = 409;
    throw err;
  }
}

export async function creerInvitationEtudiant(idUtilisateurUniversite, email) {
  const universite = await getUniversityOrThrow(idUtilisateurUniversite);
  assertUniversityCanUseFeature(universite);

  const emailNormalise = normalizeEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalise)) {
    const err = new Error("Adresse e-mail invalide");
    err.status = 422;
    throw err;
  }

  const rawToken = generateSecret(32);
  const tokenHash = hashSecret(rawToken);
  const dateExpiration = new Date(Date.now() + INVITATION_TTL_MS);

  let invitation;
  let studentUserId = null;

  await db.transaction(async (tx) => {
    const [utilisateurCible] = await tx
      .select({
        idUtilisateur: utilisateurs.idUtilisateur,
        typeUtilisateur: utilisateurs.typeUtilisateur,
        email: utilisateurs.email,
      })
      .from(utilisateurs)
      .where(eq(utilisateurs.email, emailNormalise))
      .limit(1);

    studentUserId = utilisateurCible?.idUtilisateur || null;

    if (utilisateurCible?.typeUtilisateur && utilisateurCible.typeUtilisateur !== "stagiaire") {
      const err = new Error(
        "Cette adresse e-mail est déjà associée à un autre type de compte.",
      );
      err.status = 409;
      throw err;
    }

    if (utilisateurCible?.idUtilisateur) {
      const [student] = await tx
        .select({
          idStagiaire: stagiaires.idStagiaire,
          idUniversite: stagiaires.idUniversite,
        })
        .from(stagiaires)
        .where(eq(stagiaires.idUtilisateur, utilisateurCible.idUtilisateur))
        .limit(1);

      if (student?.idUniversite && student.idUniversite !== universite.idUniversite) {
        const err = new Error(
          "Cet étudiant est déjà rattaché à un autre établissement.",
        );
        err.status = 409;
        throw err;
      }

      if (student?.idUniversite === universite.idUniversite) {
        const err = new Error("Cet étudiant est déjà rattaché à votre établissement.");
        err.status = 409;
        throw err;
      }
    }

    const [existingPending] = await tx
      .select()
      .from(rattachementsUniversitaires)
      .where(
        and(
          eq(rattachementsUniversitaires.idUniversite, universite.idUniversite),
          eq(rattachementsUniversitaires.emailCible, emailNormalise),
          eq(rattachementsUniversitaires.statut, "en_attente"),
        ),
      )
      .limit(1);

    if (existingPending) {
      [invitation] = await tx
        .update(rattachementsUniversitaires)
        .set({
          tokenHash,
          dateExpiration,
          dateDemande: new Date(),
          dateMaj: new Date(),
          idStagiaire: existingPending.idStagiaire || null,
        })
        .where(eq(rattachementsUniversitaires.idRattachement, existingPending.idRattachement))
        .returning();
    } else {
      [invitation] = await tx
        .insert(rattachementsUniversitaires)
        .values({
          idUniversite: universite.idUniversite,
          idStagiaire: null,
          emailCible: emailNormalise,
          statut: "en_attente",
          source: "invitation",
          tokenHash,
          dateDemande: new Date(),
          dateExpiration,
        })
        .returning();
    }

    await journaliser(tx, {
      idUniversite: universite.idUniversite,
      idRattachement: invitation.idRattachement,
      idUtilisateurActeur: idUtilisateurUniversite,
      action: "INVITATION_UNIVERSITE_CREEE",
      metadata: { email: emailNormalise },
    });
  });

  try {
    await sendUniversiteStudentInvitationEmail({
      email: emailNormalise,
      nomUniversite: universite.nomUniversite,
      token: rawToken,
      dateExpiration,
    });
  } catch (error) {
    console.error("Erreur envoi invitation université:", error);
  }

  if (studentUserId) {
    await creerNotification({
      idUtilisateur: studentUserId,
      type: "rattachement_universite_invitation",
      titre: "Invitation universitaire",
      message: `${universite.nomUniversite} vous a invité à rejoindre son établissement.`,
      lien: "/mon-etablissement",
    });
  }

  return {
    idRattachement: invitation.idRattachement,
    dateExpiration: invitation.dateExpiration,
  };
}

export async function getInvitationPublique(rawToken) {
  if (typeof rawToken !== "string" || rawToken.length < 32 || rawToken.length > 128) {
    const err = new Error("Invitation introuvable ou expirée");
    err.status = 404;
    throw err;
  }

  const tokenHash = hashSecret(rawToken);
  const [invitation] = await db
    .select({
      idRattachement: rattachementsUniversitaires.idRattachement,
      idUniversite: rattachementsUniversitaires.idUniversite,
      nomUniversite: universites.nomUniversite,
      statutUniversite: universites.statutVerification,
      statut: rattachementsUniversitaires.statut,
      dateExpiration: rattachementsUniversitaires.dateExpiration,
    })
    .from(rattachementsUniversitaires)
    .innerJoin(
      universites,
      eq(universites.idUniversite, rattachementsUniversitaires.idUniversite),
    )
    .where(eq(rattachementsUniversitaires.tokenHash, tokenHash))
    .limit(1);

  if (
    !invitation ||
    invitation.statut !== "en_attente" ||
    (invitation.dateExpiration && invitation.dateExpiration < new Date()) ||
    invitation.statutUniversite !== "verifiee"
  ) {
    const err = new Error("Invitation introuvable ou expirée");
    err.status = 404;
    throw err;
  }

  return {
    idRattachement: invitation.idRattachement,
    nomUniversite: invitation.nomUniversite,
    dateExpiration: invitation.dateExpiration,
  };
}

/**
 * Applique une invitation à un étudiant déjà authentifié.
 * Peut être appelée depuis l'endpoint d'acceptation ou depuis l'onboarding.
 * Le token est toujours revalidé côté serveur et n'est jamais considéré comme
 * une preuve fournie par le client en dehors de ce contrôle.
 */
export async function appliquerInvitationDansTransaction(tx, rawToken, idUtilisateur, { confirmer = true } = {}) {
  const tokenHash = hashSecret(rawToken);

  const [candidate] = await tx
    .select({ idRattachement: rattachementsUniversitaires.idRattachement })
    .from(rattachementsUniversitaires)
    .where(eq(rattachementsUniversitaires.tokenHash, tokenHash))
    .limit(1);

  if (!candidate) {
    const err = new Error("Invitation introuvable ou expirée");
    err.status = 404;
    throw err;
  }

  await tx.execute(
    sql`SELECT id_rattachement FROM rattachements_universitaires WHERE id_rattachement = ${candidate.idRattachement} FOR UPDATE`,
  );

  const [invitation] = await tx
    .select()
    .from(rattachementsUniversitaires)
    .where(eq(rattachementsUniversitaires.idRattachement, candidate.idRattachement))
    .limit(1);

  if (
    !invitation ||
    invitation.statut !== "en_attente" ||
    (invitation.dateExpiration && invitation.dateExpiration < new Date())
  ) {
    const err = new Error("Invitation introuvable ou expirée");
    err.status = 404;
    throw err;
  }

  const [universite] = await tx
    .select()
    .from(universites)
    .where(eq(universites.idUniversite, invitation.idUniversite))
    .limit(1);

  if (!universite || universite.statutVerification !== "verifiee") {
    const err = new Error("Cette invitation n'est plus valide.");
    err.status = 410;
    throw err;
  }

  const student = await getStudentByUserForUpdate(tx, idUtilisateur);

  if (!student.emailVerifie) {
    const err = new Error("Vérifiez votre adresse e-mail avant de rejoindre un établissement.");
    err.status = 403;
    throw err;
  }

  if (normalizeEmail(student.email) !== normalizeEmail(invitation.emailCible)) {
    const err = new Error(
      "Cette invitation a été envoyée à une autre adresse e-mail.",
    );
    err.status = 403;
    throw err;
  }

  await assertNoUniversityConflict(
    tx,
    student,
    invitation.idUniversite,
    invitation.idRattachement,
  );

  const statutFinal = confirmer ? "confirme" : "en_attente";
  const [rattachement] = await tx
    .update(rattachementsUniversitaires)
    .set({
      idStagiaire: student.idStagiaire,
      statut: statutFinal,
      dateConfirmation: confirmer ? new Date() : null,
      confirmePar: confirmer ? idUtilisateur : null,
      tokenHash: null,
      dateMaj: new Date(),
    })
    .where(
      and(
        eq(rattachementsUniversitaires.idRattachement, invitation.idRattachement),
        eq(rattachementsUniversitaires.statut, "en_attente"),
      ),
    )
    .returning();

  if (!rattachement) {
    const err = new Error("Cette invitation a déjà été utilisée.");
    err.status = 409;
    throw err;
  }

  if (confirmer) {
    const [updatedStudent] = await tx
      .update(stagiaires)
      .set({ idUniversite: invitation.idUniversite })
      .where(eq(stagiaires.idStagiaire, student.idStagiaire))
      .returning();

    await journaliser(tx, {
      idUniversite: invitation.idUniversite,
      idRattachement: invitation.idRattachement,
      idStagiaire: student.idStagiaire,
      idUtilisateurActeur: idUtilisateur,
      action: "INVITATION_UNIVERSITE_ACCEPTEE",
    });

    return { rattachement, student: updatedStudent, universite };
  }

  return { rattachement, student, universite };
}

export async function accepterInvitationEtudiant(idUtilisateur, rawToken) {
  if (typeof rawToken !== "string") {
    const err = new Error("Invitation invalide");
    err.status = 400;
    throw err;
  }

  let result;
  await db.transaction(async (tx) => {
    result = await appliquerInvitationDansTransaction(tx, rawToken, idUtilisateur, {
      confirmer: true,
    });
  });

  await creerNotification({
    idUtilisateur,
    type: "rattachement_universite_confirme",
    titre: "Rattachement universitaire confirmé",
    message: `${result.universite.nomUniversite} est maintenant votre établissement rattaché.`,
    lien: "/mon-etablissement",
  });

  await creerNotification({
    idUtilisateur: result.universite.idUtilisateur,
    type: "rattachement_universite_confirme",
    titre: "Étudiant rattaché",
    message: "Un étudiant a accepté votre invitation et rejoint votre établissement.",
    lien: "/etudiants-universite",
  });

  return {
    idRattachement: result.rattachement.idRattachement,
    nomUniversite: result.universite.nomUniversite,
  };
}

export async function refuserInvitationEtudiant(idUtilisateur, rawToken) {
  let result;
  await db.transaction(async (tx) => {
    const tokenHash = hashSecret(rawToken);
    const [candidate] = await tx
      .select({ idRattachement: rattachementsUniversitaires.idRattachement })
      .from(rattachementsUniversitaires)
      .where(eq(rattachementsUniversitaires.tokenHash, tokenHash))
      .limit(1);

    if (!candidate) {
      const err = new Error("Invitation introuvable ou expirée");
      err.status = 404;
      throw err;
    }

    await tx.execute(
      sql`SELECT id_rattachement FROM rattachements_universitaires WHERE id_rattachement = ${candidate.idRattachement} FOR UPDATE`,
    );

    const [invitation] = await tx
      .select()
      .from(rattachementsUniversitaires)
      .where(eq(rattachementsUniversitaires.idRattachement, candidate.idRattachement))
      .limit(1);

    if (
      !invitation ||
      invitation.statut !== "en_attente" ||
      (invitation.dateExpiration && invitation.dateExpiration < new Date())
    ) {
      const err = new Error("Invitation introuvable ou expirée");
      err.status = 404;
      throw err;
    }

    const student = await getStudentByUserForUpdate(tx, idUtilisateur);
    if (normalizeEmail(student.email) !== normalizeEmail(invitation.emailCible)) {
      const err = new Error("Cette invitation a été envoyée à une autre adresse e-mail.");
      err.status = 403;
      throw err;
    }

    const [updated] = await tx
      .update(rattachementsUniversitaires)
      .set({
        idStagiaire: student.idStagiaire,
        statut: "refuse",
        dateRefus: new Date(),
        tokenHash: null,
        dateMaj: new Date(),
      })
      .where(
        and(
          eq(rattachementsUniversitaires.idRattachement, invitation.idRattachement),
          eq(rattachementsUniversitaires.statut, "en_attente"),
        ),
      )
      .returning();

    if (!updated) {
      const err = new Error("Invitation déjà traitée");
      err.status = 409;
      throw err;
    }

    await journaliser(tx, {
      idUniversite: invitation.idUniversite,
      idRattachement: invitation.idRattachement,
      idStagiaire: student.idStagiaire,
      idUtilisateurActeur: idUtilisateur,
      action: "INVITATION_UNIVERSITE_REFUSEE",
    });

    result = { idUniversite: invitation.idUniversite };
  });

  return result;
}

export async function demanderRattachementParCode(idUtilisateur, rawCode) {
  const codeHash = hashSecret(String(rawCode || "").trim().toUpperCase());

  let result;
  try {
    await db.transaction(async (tx) => {
    const [code] = await tx
      .select()
      .from(codesRattachementUniversite)
      .where(
        and(
          eq(codesRattachementUniversite.codeHash, codeHash),
          eq(codesRattachementUniversite.actif, true),
        ),
      )
      .limit(1);

    if (
      !code ||
      (code.dateExpiration && code.dateExpiration < new Date()) ||
      code.nombreUtilisations >= code.nombreUtilisationsMax
    ) {
      const err = new Error("Code d’établissement invalide ou expiré.");
      err.status = 400;
      throw err;
    }

    await tx.execute(
      sql`SELECT id_code FROM codes_rattachement_universite WHERE id_code = ${code.idCode} FOR UPDATE`,
    );

    const [codeLocked] = await tx
      .select()
      .from(codesRattachementUniversite)
      .where(eq(codesRattachementUniversite.idCode, code.idCode))
      .limit(1);

    if (
      !codeLocked ||
      !codeLocked.actif ||
      (codeLocked.dateExpiration && codeLocked.dateExpiration < new Date()) ||
      codeLocked.nombreUtilisations >= codeLocked.nombreUtilisationsMax
    ) {
      const err = new Error("Code d’établissement invalide ou expiré.");
      err.status = 400;
      throw err;
    }

    const [universite] = await tx
      .select()
      .from(universites)
      .where(eq(universites.idUniversite, code.idUniversite))
      .limit(1);
    if (!universite || universite.statutVerification !== "verifiee") {
      const err = new Error("Ce code n'est plus valide.");
      err.status = 410;
      throw err;
    }

    const student = await getStudentByUserForUpdate(tx, idUtilisateur);
    if (!student.emailVerifie) {
      const err = new Error("Vérifiez votre adresse e-mail avant de rejoindre un établissement.");
      err.status = 403;
      throw err;
    }

    await assertNoUniversityConflict(tx, student, code.idUniversite);

    const [rattachement] = await tx
      .insert(rattachementsUniversitaires)
      .values({
        idStagiaire: student.idStagiaire,
        idUniversite: code.idUniversite,
        emailCible: normalizeEmail(student.email),
        statut: "en_attente",
        source: "code",
        dateDemande: new Date(),
      })
      .returning();

    await tx
      .update(codesRattachementUniversite)
      .set({
        nombreUtilisations: sql`${codesRattachementUniversite.nombreUtilisations} + 1`,
      })
      .where(eq(codesRattachementUniversite.idCode, code.idCode));

    await journaliser(tx, {
      idUniversite: code.idUniversite,
      idRattachement: rattachement.idRattachement,
      idStagiaire: student.idStagiaire,
      idUtilisateurActeur: idUtilisateur,
      action: "RATTACHEMENT_DEMANDE",
      metadata: { source: "code" },
    });

    result = { rattachement, idUniversite: code.idUniversite };
    });
  } catch (error) {
    rethrowDatabaseConflict(error);
  }

  await notifierUniversiteNouvelleDemande(result.idUniversite);
  return { idRattachement: result.rattachement.idRattachement, statut: "en_attente" };
}

export async function demanderRattachementParLien(idUtilisateur, rawToken) {
  const tokenHash = hashSecret(String(rawToken || ""));

  let result;
  try {
    await db.transaction(async (tx) => {
    const [link] = await tx
      .select()
      .from(liensRattachementUniversite)
      .where(
        and(
          eq(liensRattachementUniversite.tokenHash, tokenHash),
          eq(liensRattachementUniversite.actif, true),
        ),
      )
      .limit(1);

    if (
      !link ||
      (link.dateExpiration && link.dateExpiration < new Date()) ||
      link.nombreUtilisations >= link.nombreUtilisationsMax
    ) {
      const err = new Error("Lien d’inscription invalide ou expiré.");
      err.status = 400;
      throw err;
    }

    await tx.execute(
      sql`SELECT id_lien FROM liens_rattachement_universite WHERE id_lien = ${link.idLien} FOR UPDATE`,
    );

    const [linkLocked] = await tx
      .select()
      .from(liensRattachementUniversite)
      .where(eq(liensRattachementUniversite.idLien, link.idLien))
      .limit(1);

    if (
      !linkLocked ||
      !linkLocked.actif ||
      (linkLocked.dateExpiration && linkLocked.dateExpiration < new Date()) ||
      linkLocked.nombreUtilisations >= linkLocked.nombreUtilisationsMax
    ) {
      const err = new Error("Lien d’inscription invalide ou expiré.");
      err.status = 400;
      throw err;
    }

    const [universite] = await tx
      .select()
      .from(universites)
      .where(eq(universites.idUniversite, link.idUniversite))
      .limit(1);
    if (!universite || universite.statutVerification !== "verifiee") {
      const err = new Error("Ce lien n'est plus valide.");
      err.status = 410;
      throw err;
    }

    const student = await getStudentByUserForUpdate(tx, idUtilisateur);
    if (!student.emailVerifie) {
      const err = new Error("Vérifiez votre adresse e-mail avant de rejoindre un établissement.");
      err.status = 403;
      throw err;
    }

    await assertNoUniversityConflict(tx, student, link.idUniversite);

    const [rattachement] = await tx
      .insert(rattachementsUniversitaires)
      .values({
        idStagiaire: student.idStagiaire,
        idUniversite: link.idUniversite,
        emailCible: normalizeEmail(student.email),
        statut: "en_attente",
        source: "lien",
        dateDemande: new Date(),
      })
      .returning();

    await tx
      .update(liensRattachementUniversite)
      .set({
        nombreUtilisations: sql`${liensRattachementUniversite.nombreUtilisations} + 1`,
      })
      .where(eq(liensRattachementUniversite.idLien, link.idLien));

    await journaliser(tx, {
      idUniversite: link.idUniversite,
      idRattachement: rattachement.idRattachement,
      idStagiaire: student.idStagiaire,
      idUtilisateurActeur: idUtilisateur,
      action: "RATTACHEMENT_DEMANDE",
      metadata: { source: "lien" },
    });

    result = { rattachement, idUniversite: link.idUniversite };
    });
  } catch (error) {
    rethrowDatabaseConflict(error);
  }

  await notifierUniversiteNouvelleDemande(result.idUniversite);
  return { idRattachement: result.rattachement.idRattachement, statut: "en_attente" };
}

async function notifierUniversiteNouvelleDemande(idUniversite) {
  const [universite] = await db
    .select({ idUtilisateur: universites.idUtilisateur, nomUniversite: universites.nomUniversite })
    .from(universites)
    .where(eq(universites.idUniversite, idUniversite))
    .limit(1);

  if (universite) {
    await creerNotification({
      idUtilisateur: universite.idUtilisateur,
      type: "rattachement_universite_demande",
      titre: "Nouvelle demande de rattachement",
      message: "Un étudiant souhaite rejoindre votre établissement.",
      lien: "/etudiants-universite",
    });
  }
}

export async function listerDemandesUniversite(idUtilisateurUniversite) {
  const universite = await getUniversityOrThrow(idUtilisateurUniversite);

  return db
    .select({
      idRattachement: rattachementsUniversitaires.idRattachement,
      idStagiaire: rattachementsUniversitaires.idStagiaire,
      email: rattachementsUniversitaires.emailCible,
      statut: rattachementsUniversitaires.statut,
      source: rattachementsUniversitaires.source,
      dateDemande: rattachementsUniversitaires.dateDemande,
      prenom: stagiaires.prenom,
      nom: stagiaires.nom,
      ville: stagiaires.ville,
    })
    .from(rattachementsUniversitaires)
    .leftJoin(stagiaires, eq(stagiaires.idStagiaire, rattachementsUniversitaires.idStagiaire))
    .where(
      and(
        eq(rattachementsUniversitaires.idUniversite, universite.idUniversite),
        eq(rattachementsUniversitaires.statut, "en_attente"),
      ),
    )
    .orderBy(desc(rattachementsUniversitaires.dateDemande));
}

async function getOwnedRequestOrThrow(tx, idUtilisateurUniversite, idRattachement) {
  assertUuidLike(idRattachement, "Demande invalide");

  const [universite] = await tx
    .select()
    .from(universites)
    .where(eq(universites.idUtilisateur, idUtilisateurUniversite))
    .limit(1);

  if (!universite) {
    const err = new Error("Profil université introuvable");
    err.status = 404;
    throw err;
  }
  assertUniversityCanUseFeature(universite);

  const [request] = await tx
    .select()
    .from(rattachementsUniversitaires)
    .where(
      and(
        eq(rattachementsUniversitaires.idRattachement, idRattachement),
        eq(rattachementsUniversitaires.idUniversite, universite.idUniversite),
      ),
    )
    .limit(1);

  if (!request) {
    const err = new Error("Demande introuvable");
    err.status = 404;
    throw err;
  }

  return { universite, request };
}

export async function confirmerDemandeUniversite(idUtilisateurUniversite, idRattachement) {
  let result;
  await db.transaction(async (tx) => {
    const { universite, request } = await getOwnedRequestOrThrow(
      tx,
      idUtilisateurUniversite,
      idRattachement,
    );

    await tx.execute(
      sql`SELECT id_rattachement FROM rattachements_universitaires WHERE id_rattachement = ${request.idRattachement} FOR UPDATE`,
    );

    const [locked] = await tx
      .select()
      .from(rattachementsUniversitaires)
      .where(eq(rattachementsUniversitaires.idRattachement, request.idRattachement))
      .limit(1);

    if (!locked || locked.statut !== "en_attente" || !locked.idStagiaire) {
      const err = new Error("Cette demande n'est plus disponible.");
      err.status = 409;
      throw err;
    }

    const [student] = await tx
      .select()
      .from(stagiaires)
      .where(eq(stagiaires.idStagiaire, locked.idStagiaire))
      .limit(1);

    if (!student) {
      const err = new Error("Étudiant introuvable");
      err.status = 404;
      throw err;
    }

    await assertNoUniversityConflict(
      tx,
      student,
      universite.idUniversite,
      locked.idRattachement,
    );

    const [updated] = await tx
      .update(rattachementsUniversitaires)
      .set({
        statut: "confirme",
        dateConfirmation: new Date(),
        confirmePar: idUtilisateurUniversite,
        dateMaj: new Date(),
      })
      .where(
        and(
          eq(rattachementsUniversitaires.idRattachement, locked.idRattachement),
          eq(rattachementsUniversitaires.statut, "en_attente"),
        ),
      )
      .returning();

    if (!updated) {
      const err = new Error("Cette demande a déjà été traitée.");
      err.status = 409;
      throw err;
    }

    const [studentUpdated] = await tx
      .update(stagiaires)
      .set({ idUniversite: universite.idUniversite })
      .where(eq(stagiaires.idStagiaire, student.idStagiaire))
      .returning();

    await journaliser(tx, {
      idUniversite: universite.idUniversite,
      idRattachement: locked.idRattachement,
      idStagiaire: student.idStagiaire,
      idUtilisateurActeur: idUtilisateurUniversite,
      action: "RATTACHEMENT_CONFIRME",
    });

    result = { student: studentUpdated, universite };
  });

  await creerNotification({
    idUtilisateur: result.student.idUtilisateur,
    type: "rattachement_universite_confirme",
    titre: "Rattachement universitaire confirmé",
    message: `${result.universite.nomUniversite} a confirmé votre rattachement.`,
    lien: "/mon-etablissement",
  });

  return { statut: "confirme", idUniversite: result.universite.idUniversite };
}

export async function refuserDemandeUniversite(idUtilisateurUniversite, idRattachement) {
  let result;
  await db.transaction(async (tx) => {
    const { universite, request } = await getOwnedRequestOrThrow(
      tx,
      idUtilisateurUniversite,
      idRattachement,
    );

    await tx.execute(
      sql`SELECT id_rattachement FROM rattachements_universitaires WHERE id_rattachement = ${request.idRattachement} FOR UPDATE`,
    );

    const [updated] = await tx
      .update(rattachementsUniversitaires)
      .set({
        statut: "refuse",
        dateRefus: new Date(),
        dateMaj: new Date(),
      })
      .where(
        and(
          eq(rattachementsUniversitaires.idRattachement, request.idRattachement),
          eq(rattachementsUniversitaires.statut, "en_attente"),
        ),
      )
      .returning();

    if (!updated) {
      const err = new Error("Cette demande a déjà été traitée.");
      err.status = 409;
      throw err;
    }

    await journaliser(tx, {
      idUniversite: universite.idUniversite,
      idRattachement: request.idRattachement,
      idStagiaire: request.idStagiaire,
      idUtilisateurActeur: idUtilisateurUniversite,
      action: "RATTACHEMENT_REFUSE",
    });

    result = { idStagiaire: request.idStagiaire };
  });

  if (result.idStagiaire) {
    const [student] = await db
      .select({ idUtilisateur: stagiaires.idUtilisateur })
      .from(stagiaires)
      .where(eq(stagiaires.idStagiaire, result.idStagiaire))
      .limit(1);
    if (student) {
      await creerNotification({
        idUtilisateur: student.idUtilisateur,
        type: "rattachement_universite_refuse",
        titre: "Demande de rattachement refusée",
        message: "Votre demande de rattachement universitaire a été refusée.",
        lien: "/mon-etablissement",
      });
    }
  }
}

export async function creerCodeUniversite(idUtilisateurUniversite) {
  const universite = await getUniversityOrThrow(idUtilisateurUniversite);
  assertUniversityCanUseFeature(universite);

  const rawCode = generateInstitutionCode();
  const codeHash = hashSecret(rawCode);
  const dateExpiration = new Date(Date.now() + CODE_TTL_MS);

  await db.transaction(async (tx) => {
    await tx
      .update(codesRattachementUniversite)
      .set({ actif: false, dateRevocation: new Date() })
      .where(
        and(
          eq(codesRattachementUniversite.idUniversite, universite.idUniversite),
          eq(codesRattachementUniversite.actif, true),
        ),
      );

    await tx.insert(codesRattachementUniversite).values({
      idUniversite: universite.idUniversite,
      codeHash,
      actif: true,
      dateExpiration,
      nombreUtilisations: 0,
      nombreUtilisationsMax: 100,
    });

    await journaliser(tx, {
      idUniversite: universite.idUniversite,
      idUtilisateurActeur: idUtilisateurUniversite,
      action: "CODE_UNIVERSITE_GENERE",
    });
  });

  return { code: rawCode, dateExpiration };
}

export async function getCodeUniversite(idUtilisateurUniversite) {
  const universite = await getUniversityOrThrow(idUtilisateurUniversite);
  const [code] = await db
    .select({
      actif: codesRattachementUniversite.actif,
      dateExpiration: codesRattachementUniversite.dateExpiration,
      nombreUtilisations: codesRattachementUniversite.nombreUtilisations,
      nombreUtilisationsMax: codesRattachementUniversite.nombreUtilisationsMax,
    })
    .from(codesRattachementUniversite)
    .where(
      and(
        eq(codesRattachementUniversite.idUniversite, universite.idUniversite),
        eq(codesRattachementUniversite.actif, true),
      ),
    )
    .limit(1);

  return code || null;
}

export async function creerLienUniversite(idUtilisateurUniversite) {
  const universite = await getUniversityOrThrow(idUtilisateurUniversite);
  assertUniversityCanUseFeature(universite);

  const rawToken = generateSecret(32);
  const tokenHash = hashSecret(rawToken);
  const dateExpiration = new Date(Date.now() + LINK_TTL_MS);

  await db.transaction(async (tx) => {
    await tx
      .update(liensRattachementUniversite)
      .set({ actif: false, dateRevocation: new Date() })
      .where(
        and(
          eq(liensRattachementUniversite.idUniversite, universite.idUniversite),
          eq(liensRattachementUniversite.actif, true),
        ),
      );

    await tx.insert(liensRattachementUniversite).values({
      idUniversite: universite.idUniversite,
      tokenHash,
      actif: true,
      dateExpiration,
      nombreUtilisations: 0,
      nombreUtilisationsMax: 500,
    });

    await journaliser(tx, {
      idUniversite: universite.idUniversite,
      idUtilisateurActeur: idUtilisateurUniversite,
      action: "LIEN_UNIVERSITE_GENERE",
    });
  });

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  return {
    lien: `${frontendUrl}/rejoindre/universite/${rawToken}`,
    dateExpiration,
  };
}

export async function getRattachementEtudiant(idUtilisateur) {
  const [student] = await db
    .select({
      idStagiaire: stagiaires.idStagiaire,
      idUniversite: stagiaires.idUniversite,
    })
    .from(stagiaires)
    .where(eq(stagiaires.idUtilisateur, idUtilisateur))
    .limit(1);

  if (!student) {
    const err = new Error("Profil stagiaire introuvable");
    err.status = 404;
    throw err;
  }

  if (!student.idUniversite) {
    const [demande] = await db
      .select({
        idRattachement: rattachementsUniversitaires.idRattachement,
        idUniversite: rattachementsUniversitaires.idUniversite,
        statut: rattachementsUniversitaires.statut,
        source: rattachementsUniversitaires.source,
        dateDemande: rattachementsUniversitaires.dateDemande,
      })
      .from(rattachementsUniversitaires)
      .where(eq(rattachementsUniversitaires.idStagiaire, student.idStagiaire))
      .orderBy(desc(rattachementsUniversitaires.dateCreation))
      .limit(1);

    let universiteDemande = null;
    if (demande?.idUniversite) {
      const [u] = await db
        .select({
          idUniversite: universites.idUniversite,
          nomUniversite: universites.nomUniversite,
          logoUrl: universites.logoUrl,
          siteWeb: universites.siteWeb,
        })
        .from(universites)
        .where(eq(universites.idUniversite, demande.idUniversite))
        .limit(1);
      universiteDemande = u || null;
    }

    return {
      rattache: false,
      universite: null,
      demande: demande
        ? { ...demande, universite: universiteDemande }
        : null,
    };
  }

  const [universite] = await db
    .select({
      idUniversite: universites.idUniversite,
      nomUniversite: universites.nomUniversite,
      logoUrl: universites.logoUrl,
      siteWeb: universites.siteWeb,
      statutVerification: universites.statutVerification,
    })
    .from(universites)
    .where(eq(universites.idUniversite, student.idUniversite))
    .limit(1);

  const [latest] = await db
    .select()
    .from(rattachementsUniversitaires)
    .where(
      and(
        eq(rattachementsUniversitaires.idStagiaire, student.idStagiaire),
        eq(rattachementsUniversitaires.idUniversite, student.idUniversite),
      ),
    )
    .orderBy(desc(rattachementsUniversitaires.dateCreation))
    .limit(1);

  return {
    rattache: true,
    universite: universite || null,
    demande: latest
      ? {
          idRattachement: latest.idRattachement,
          statut: latest.statut,
          source: latest.source,
          dateDemande: latest.dateDemande,
        }
      : null,
  };
}


export async function annulerInvitationEtudiant(
  idUtilisateurUniversite,
  idRattachement,
) {
  const universite = await getUniversityOrThrow(idUtilisateurUniversite);
  assertUuidLike(idRattachement, "Invitation invalide");

  const [updated] = await db
    .update(rattachementsUniversitaires)
    .set({
      statut: "annule",
      tokenHash: null,
      dateMaj: new Date(),
    })
    .where(
      and(
        eq(rattachementsUniversitaires.idRattachement, idRattachement),
        eq(rattachementsUniversitaires.idUniversite, universite.idUniversite),
        eq(rattachementsUniversitaires.statut, "en_attente"),
        eq(rattachementsUniversitaires.source, "invitation"),
      ),
    )
    .returning();

  if (!updated) {
    const err = new Error("Invitation introuvable ou déjà traitée.");
    err.status = 404;
    throw err;
  }

  await journaliser(db, {
    idUniversite: universite.idUniversite,
    idRattachement,
    idUtilisateurActeur: idUtilisateurUniversite,
    action: "INVITATION_UNIVERSITE_REVOQUEE",
  });

  return { annulee: true };
}

export async function revoquerCodeUniversite(idUtilisateurUniversite) {
  const universite = await getUniversityOrThrow(idUtilisateurUniversite);
  const [updated] = await db
    .update(codesRattachementUniversite)
    .set({ actif: false, dateRevocation: new Date() })
    .where(
      and(
        eq(codesRattachementUniversite.idUniversite, universite.idUniversite),
        eq(codesRattachementUniversite.actif, true),
      ),
    )
    .returning({ idCode: codesRattachementUniversite.idCode });

  if (updated) {
    await journaliser(db, {
      idUniversite: universite.idUniversite,
      idUtilisateurActeur: idUtilisateurUniversite,
      action: "CODE_UNIVERSITE_REVOQUE",
    });
  }

  return { revoque: Boolean(updated) };
}

export async function revoquerLienUniversite(idUtilisateurUniversite) {
  const universite = await getUniversityOrThrow(idUtilisateurUniversite);
  const [updated] = await db
    .update(liensRattachementUniversite)
    .set({ actif: false, dateRevocation: new Date() })
    .where(
      and(
        eq(liensRattachementUniversite.idUniversite, universite.idUniversite),
        eq(liensRattachementUniversite.actif, true),
      ),
    )
    .returning({ idLien: liensRattachementUniversite.idLien });

  if (updated) {
    await journaliser(db, {
      idUniversite: universite.idUniversite,
      idUtilisateurActeur: idUtilisateurUniversite,
      action: "LIEN_UNIVERSITE_REVOQUE",
    });
  }

  return { revoque: Boolean(updated) };
}
