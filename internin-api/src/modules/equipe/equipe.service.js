import { eq, and, or, ilike, ne, desc } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { db } from "../../db/index.js";
import { hashPassword } from "../../utils/password.js";
import { signToken } from "../../utils/jwt.js";
import {
  CLES_PERMISSIONS,
  PERMISSIONS_PAR_DEFAUT_ROLE,
} from "./equipe.constants.js";
import {
  entreprises,
  contactsEntreprise,
  utilisateurs,
  membresEquipe,
  affectationsSuperviseurStage,
  activitesEquipe,
  parametresEquipeEntreprise,
  stages,
  stagiaires,
  offresStage,
  conventionsStage,
  offresFinales,
  entretiens,
  candidatures,
} from "../../db/schema.js";
import { EXPIRATION_INVITATION_JOURS_DEFAUT } from "./equipe.constants.js";
import { sendInvitationEmail } from "../../utils/email.js";

// -----------------------------------------------------------------------
// Helpers internes
// -----------------------------------------------------------------------

// -----------------------------------------------------------------------
// Contrôle d'escalade de privilèges
// Un membre avec "equipe.gerer" ne peut jamais attribuer un rôle ou des
// permissions effectives qu'il ne possède pas lui-même. Le propriétaire
// (compte entreprise) et l'administrateur principal gardent l'autorité
// complète. Les permissions envoyées par le frontend ne sont jamais
// considérées comme source de vérité pour le demandeur.
// -----------------------------------------------------------------------

function permissionsEffectivesMembre(membre) {
  if (!membre) return [];
  if (membre.estAdminPrincipal) return [...CLES_PERMISSIONS];
  return (
    membre.permissionsPersonnalisees ??
    PERMISSIONS_PAR_DEFAUT_ROLE[membre.roleEquipe] ??
    []
  );
}

/** Permissions effectives qu'un rôle (+ permissions perso optionnelles) conférerait. */
function permissionsCibles({ roleEquipe, permissionsPersonnalisees }) {
  if (roleEquipe === "administrateur_principal") {
    return [...CLES_PERMISSIONS];
  }
  if (permissionsPersonnalisees != null) {
    return permissionsPersonnalisees;
  }
  return PERMISSIONS_PAR_DEFAUT_ROLE[roleEquipe] ?? [];
}

/**
 * Refuse si le demandeur n'est pas propriétaire/admin principal et tente
 * d'accorder au moins une permission qu'il ne possède pas.
 */
async function assertPasDEscalade(idUtilisateurDemandeur, cible) {
  // Propriétaire de l'entreprise (compte type entreprise) : autorité complète
  const [entreprise] = await db
    .select({ idEntreprise: entreprises.idEntreprise })
    .from(entreprises)
    .where(eq(entreprises.idUtilisateur, idUtilisateurDemandeur));
  if (entreprise) return;

  const [demandeur] = await db
    .select()
    .from(membresEquipe)
    .where(
      and(
        eq(membresEquipe.idUtilisateur, idUtilisateurDemandeur),
        eq(membresEquipe.statutMembre, "actif"),
      ),
    );

  if (!demandeur) {
    const err = new Error("Accès refusé");
    err.status = 403;
    throw err;
  }

  if (demandeur.estAdminPrincipal) return;

  const permissionsDemandeur = permissionsEffectivesMembre(demandeur);
  const permissionsCible = permissionsCibles(cible);

  const nonAutorisee = permissionsCible.find(
    (cle) => !permissionsDemandeur.includes(cle),
  );

  if (nonAutorisee) {
    const err = new Error(
      `Vous ne pouvez pas attribuer la permission "${nonAutorisee}" car vous ne la possédez pas vous-même.`,
    );
    err.status = 403;
    throw err;
  }

  // Interdire d'attribuer le rôle administrateur_principal si le demandeur ne l'est pas
  if (cible.roleEquipe === "administrateur_principal") {
    const err = new Error(
      "Vous ne pouvez pas attribuer le rôle d'administrateur principal.",
    );
    err.status = 403;
    throw err;
  }
}



// Résout l'entreprise à partir de l'utilisateur connecté — accepte à la
// fois le compte propriétaire (typeUtilisateur="entreprise") ET un membre
// d'équipe actif invité (typeUtilisateur="membre_entreprise"). Le contrôle
// de PERMISSION (qui a le droit de faire quoi) est géré séparément par le
// middleware requireEquipePermission (equipe.permissions.js), appliqué sur
// les routes sensibles — cette fonction ne fait que retrouver l'entreprise.
async function getEntrepriseOrThrow(idUtilisateurEntreprise) {
  const [entreprise] = await db
    .select()
    .from(entreprises)
    .where(eq(entreprises.idUtilisateur, idUtilisateurEntreprise));
  if (entreprise) return entreprise;

  const [membre] = await db
    .select()
    .from(membresEquipe)
    .where(
      and(
        eq(membresEquipe.idUtilisateur, idUtilisateurEntreprise),
        eq(membresEquipe.statutMembre, "actif"),
      ),
    );
  if (membre) {
    const [entrepriseDuMembre] = await db
      .select()
      .from(entreprises)
      .where(eq(entreprises.idEntreprise, membre.idEntreprise));
    if (entrepriseDuMembre) return entrepriseDuMembre;
  }

  const err = new Error("Profil entreprise introuvable");
  err.status = 404;
  throw err;
}

// Le membre "administrateur principal" représente le compte propriétaire de
// l'entreprise. Il est créé paresseusement au premier accès au menu Équipe
// plutôt qu'à l'onboarding, pour ne pas toucher au flux d'inscription existant.
async function getOrCreateAdminPrincipal(idEntreprise, idUtilisateur) {
  const [existant] = await db
    .select()
    .from(membresEquipe)
    .where(
      and(
        eq(membresEquipe.idEntreprise, idEntreprise),
        eq(membresEquipe.estAdminPrincipal, true),
      ),
    );
  if (existant) return existant;

  const [utilisateur] = await db
    .select({ email: utilisateurs.email })
    .from(utilisateurs)
    .where(eq(utilisateurs.idUtilisateur, idUtilisateur));

  const [contactPrincipal] = await db
    .select({ nom: contactsEntreprise.nom })
    .from(contactsEntreprise)
    .where(
      and(
        eq(contactsEntreprise.idEntreprise, idEntreprise),
        eq(contactsEntreprise.estContactPrincipal, true),
      ),
    );

  const [membre] = await db
    .insert(membresEquipe)
    .values({
      idEntreprise,
      idUtilisateur,
      nom: contactPrincipal?.nom || "Administrateur",
      email: utilisateur?.email || "",
      roleEquipe: "administrateur_principal",
      estAdminPrincipal: true,
      statutMembre: "actif",
      dateActivation: new Date(),
    })
    .returning();

  return membre;
}

async function getParametresOuDefaut(idEntreprise) {
  const [params] = await db
    .select()
    .from(parametresEquipeEntreprise)
    .where(eq(parametresEquipeEntreprise.idEntreprise, idEntreprise));
  if (params) return params;
  return {
    idEntreprise,
    roleParDefautInvitation: "lecture_seule",
    expirationInvitationJours: EXPIRATION_INVITATION_JOURS_DEFAUT,
    approbationRequisePourInvitation: false,
    notifierAdminNouvelleActivite: true,
  };
}

async function enregistrerActivite(idEntreprise, idMembre, action, details) {
  await db.insert(activitesEquipe).values({
    idEntreprise,
    idMembre: idMembre || null,
    action,
    details: details || null,
  });
}

async function getMembreEntrepriseOrThrow(idEntreprise, idMembre) {
  const [membre] = await db
    .select()
    .from(membresEquipe)
    .where(
      and(
        eq(membresEquipe.idMembre, idMembre),
        eq(membresEquipe.idEntreprise, idEntreprise),
      ),
    );
  if (!membre) {
    const err = new Error("Membre introuvable");
    err.status = 404;
    throw err;
  }
  return membre;
}

// -----------------------------------------------------------------------
// Membres — liste, recherche, filtres
// -----------------------------------------------------------------------

export async function listMembres(
  idUtilisateurEntreprise,
  { recherche, role, statut } = {},
) {
  const entreprise = await getEntrepriseOrThrow(idUtilisateurEntreprise);
  await getOrCreateAdminPrincipal(
    entreprise.idEntreprise,
    idUtilisateurEntreprise,
  );

  const conditions = [eq(membresEquipe.idEntreprise, entreprise.idEntreprise)];

  if (recherche) {
    conditions.push(
      or(
        ilike(membresEquipe.nom, `%${recherche}%`),
        ilike(membresEquipe.email, `%${recherche}%`),
      ),
    );
  }
  if (role) {
    conditions.push(eq(membresEquipe.roleEquipe, role));
  }
  if (statut) {
    conditions.push(eq(membresEquipe.statutMembre, statut));
  }

  return db
    .select()
    .from(membresEquipe)
    .where(and(...conditions))
    .orderBy(desc(membresEquipe.estAdminPrincipal), membresEquipe.nom);
}

// -----------------------------------------------------------------------
// Invitations
// -----------------------------------------------------------------------

export async function inviterMembre(idUtilisateurEntreprise, payload) {
  const entreprise = await getEntrepriseOrThrow(idUtilisateurEntreprise);
  const admin = await getOrCreateAdminPrincipal(
    entreprise.idEntreprise,
    idUtilisateurEntreprise,
  );

  // Normalisation email (trim + lowercase) avant toute comparaison / stockage
  const emailNormalise = String(payload.email || "").trim().toLowerCase();
  if (!emailNormalise) {
    const err = new Error("Adresse e-mail invalide.");
    err.status = 400;
    throw err;
  }

  // Empêche d'attribuer un rôle / des permissions supérieurs à ceux du demandeur
  await assertPasDEscalade(idUtilisateurEntreprise, {
    roleEquipe: payload.roleEquipe,
    permissionsPersonnalisees: payload.permissionsPersonnalisees ?? null,
  });

  const [existant] = await db
    .select()
    .from(membresEquipe)
    .where(
      and(
        eq(membresEquipe.idEntreprise, entreprise.idEntreprise),
        eq(membresEquipe.email, emailNormalise),
        ne(membresEquipe.statutMembre, "desactive"),
      ),
    );
  if (existant) {
    const err = new Error(
      "Cette personne fait déjà partie de l'équipe ou a déjà été invitée.",
    );
    err.status = 409;
    throw err;
  }

  const parametres = await getParametresOuDefaut(entreprise.idEntreprise);
  const dateExpiration = new Date();
  dateExpiration.setDate(
    dateExpiration.getDate() + parametres.expirationInvitationJours,
  );

  let membre;
  try {
    [membre] = await db
      .insert(membresEquipe)
      .values({
        idEntreprise: entreprise.idEntreprise,
        nom: payload.nom,
        email: emailNormalise,
        roleEquipe: payload.roleEquipe,
        permissionsPersonnalisees: payload.permissionsPersonnalisees || null,
        statutMembre: "invite",
        tokenInvitation: randomBytes(32).toString("hex"),
        dateEnvoiInvitation: new Date(),
        dateExpirationInvitation: dateExpiration,
      })
      .returning();
  } catch (dbErr) {
    // Contrainte unique PostgreSQL (course concurrente)
    if (dbErr?.code === "23505") {
      const err = new Error(
        "Cette personne fait déjà partie de l'équipe ou a déjà été invitée.",
      );
      err.status = 409;
      throw err;
    }
    throw dbErr;
  }

  // Envoi de l'e-mail d'invitation
  try {
    await sendInvitationEmail({
      email: membre.email,
      nom: membre.nom,
      token: membre.tokenInvitation,
      nomEntreprise: entreprise.nomEntreprise,
      roleEquipe: membre.roleEquipe,
      dateExpiration: membre.dateExpirationInvitation,
    });
  } catch (emailError) {
    // Le membre est déjà créé : on log l'erreur sans faire échouer l'invitation
    console.error(
      "Erreur lors de l'envoi de l'e-mail d'invitation :",
      emailError,
    );
  }

  await enregistrerActivite(
    entreprise.idEntreprise,
    admin.idMembre,
    "invitation_envoyee",
    `${payload.nom} (${payload.email}) invité en tant que ${payload.roleEquipe}`,
  );

  return membre;
}

export async function renvoyerInvitation(idUtilisateurEntreprise, idMembre) {
  const entreprise = await getEntrepriseOrThrow(idUtilisateurEntreprise);
  const admin = await getOrCreateAdminPrincipal(
    entreprise.idEntreprise,
    idUtilisateurEntreprise,
  );
  const membre = await getMembreEntrepriseOrThrow(
    entreprise.idEntreprise,
    idMembre,
  );

  if (membre.statutMembre !== "invite") {
    const err = new Error("Cette invitation n'est plus en attente.");
    err.status = 409;
    throw err;
  }

  const parametres = await getParametresOuDefaut(entreprise.idEntreprise);
  const dateExpiration = new Date();
  dateExpiration.setDate(
    dateExpiration.getDate() + parametres.expirationInvitationJours,
  );

  const [miseAJour] = await db
    .update(membresEquipe)
    .set({
      tokenInvitation: randomBytes(32).toString("hex"),
      dateEnvoiInvitation: new Date(),
      dateExpirationInvitation: dateExpiration,
      nombreRenvoisInvitation: (membre.nombreRenvoisInvitation || 0) + 1,
    })
    .where(eq(membresEquipe.idMembre, idMembre))
    .returning();
  
    try {
      await sendInvitationEmail({
        email: miseAJour.email,
        nom: miseAJour.nom,
        token: miseAJour.tokenInvitation,
        nomEntreprise: entreprise.nomEntreprise,
        roleEquipe: miseAJour.roleEquipe,
        dateExpiration: miseAJour.dateExpirationInvitation,
      });
    } catch (emailError) {
      console.error(
        "Erreur lors du renvoi de l'e-mail d'invitation :",
        emailError,
      );
    }

  await enregistrerActivite(
    entreprise.idEntreprise,
    admin.idMembre,
    "invitation_renvoyee",
    `Invitation renvoyée à ${membre.nom} (${membre.email})`,
  );

  return miseAJour;
}

export async function annulerInvitation(idUtilisateurEntreprise, idMembre) {
  const entreprise = await getEntrepriseOrThrow(idUtilisateurEntreprise);
  const admin = await getOrCreateAdminPrincipal(
    entreprise.idEntreprise,
    idUtilisateurEntreprise,
  );
  const membre = await getMembreEntrepriseOrThrow(
    entreprise.idEntreprise,
    idMembre,
  );

  if (membre.statutMembre !== "invite") {
    const err = new Error("Seule une invitation en attente peut être annulée.");
    err.status = 409;
    throw err;
  }

  await db.delete(membresEquipe).where(eq(membresEquipe.idMembre, idMembre));

  await enregistrerActivite(
    entreprise.idEntreprise,
    admin.idMembre,
    "invitation_annulee",
    `Invitation annulée pour ${membre.nom} (${membre.email})`,
  );

  return { deleted: true };
}

// -----------------------------------------------------------------------
// Rôles, permissions, activation / désactivation
// -----------------------------------------------------------------------

export async function updateMembre(idUtilisateurEntreprise, idMembre, payload) {
  const entreprise = await getEntrepriseOrThrow(idUtilisateurEntreprise);
  const admin = await getOrCreateAdminPrincipal(
    entreprise.idEntreprise,
    idUtilisateurEntreprise,
  );
  const membre = await getMembreEntrepriseOrThrow(
    entreprise.idEntreprise,
    idMembre,
  );

  if (membre.estAdminPrincipal) {
    const err = new Error(
      "Le rôle de l'administrateur principal ne peut pas être modifié.",
    );
    err.status = 403;
    throw err;
  }

  // Un membre ne doit jamais pouvoir modifier ses propres permissions —
  // même s'il possède "equipe.gerer", sinon il peut s'auto-attribuer
  // n'importe quelle permission (escalade de privilèges).
  if (membre.idUtilisateur === idUtilisateurEntreprise) {
    const err = new Error(
      "Vous ne pouvez pas modifier vos propres permissions.",
    );
    err.status = 403;
    throw err;
  }

  // Contrôle d'escalade : rôle ET permissions effectives (y compris héritage
  // des permissions par défaut du rôle si permissionsPersonnalisees est null).
  const roleCible = payload.roleEquipe ?? membre.roleEquipe;
  const permissionsCiblePayload =
    payload.permissionsPersonnalisees !== undefined
      ? payload.permissionsPersonnalisees
      : membre.permissionsPersonnalisees;

  await assertPasDEscalade(idUtilisateurEntreprise, {
    roleEquipe: roleCible,
    permissionsPersonnalisees: permissionsCiblePayload,
  });

  const [miseAJour] = await db
    .update(membresEquipe)
    .set(payload)
    .where(eq(membresEquipe.idMembre, idMembre))
    .returning();

  await enregistrerActivite(
    entreprise.idEntreprise,
    admin.idMembre,
    "permissions_modifiees",
    `Rôle/permissions mis à jour pour ${membre.nom}`,
  );

  return miseAJour;
}

export async function updateStatutMembre(
  idUtilisateurEntreprise,
  idMembre,
  statutMembre,
) {
  const entreprise = await getEntrepriseOrThrow(idUtilisateurEntreprise);
  const admin = await getOrCreateAdminPrincipal(
    entreprise.idEntreprise,
    idUtilisateurEntreprise,
  );
  const membre = await getMembreEntrepriseOrThrow(
    entreprise.idEntreprise,
    idMembre,
  );

  if (membre.estAdminPrincipal) {
    const err = new Error(
      "L'administrateur principal ne peut pas être désactivé.",
    );
    err.status = 403;
    throw err;
  }
  if (membre.statutMembre === "invite") {
    const err = new Error(
      "Une invitation en attente n'a pas encore de compte à activer/désactiver.",
    );
    err.status = 409;
    throw err;
  }

  const [miseAJour] = await db
    .update(membresEquipe)
    .set({
      statutMembre,
      dateActivation:
        statutMembre === "actif" ? new Date() : membre.dateActivation,
      dateDesactivation: statutMembre === "desactive" ? new Date() : null,
    })
    .where(eq(membresEquipe.idMembre, idMembre))
    .returning();

  await enregistrerActivite(
    entreprise.idEntreprise,
    admin.idMembre,
    statutMembre === "actif" ? "membre_active" : "membre_desactive",
    `${membre.nom} (${membre.email})`,
  );

  return miseAJour;
}

// -----------------------------------------------------------------------
// Affectations stagiaires ↔ superviseurs
// -----------------------------------------------------------------------

// Liste les stages actifs de l'entreprise avec, s'il existe, le membre
// actuellement affecté comme superviseur responsable de l'encadrement.
export async function listAffectations(idUtilisateurEntreprise) {
  const entreprise = await getEntrepriseOrThrow(idUtilisateurEntreprise);

  return db
    .select({
      idStage: stages.idStage,
      statutStage: stages.statut,
      dateDebut: stages.dateDebut,
      dateFinPrevue: stages.dateFinPrevue,
      prenomStagiaire: stagiaires.prenom,
      nomStagiaire: stagiaires.nom,
      titrePoste: offresStage.titre,
      idAffectation: affectationsSuperviseurStage.idAffectation,
      idMembre: membresEquipe.idMembre,
      nomSuperviseur: membresEquipe.nom,
    })
    .from(stages)
    .innerJoin(stagiaires, eq(stages.idStagiaire, stagiaires.idStagiaire))
    .innerJoin(
      conventionsStage,
      eq(stages.idConvention, conventionsStage.idConvention),
    )
    .innerJoin(
      offresFinales,
      eq(conventionsStage.idOffreFinale, offresFinales.idOffreFinale),
    )
    .innerJoin(
      entretiens,
      eq(offresFinales.idEntretien, entretiens.idEntretien),
    )
    .innerJoin(
      candidatures,
      eq(entretiens.idCandidature, candidatures.idCandidature),
    )
    .innerJoin(offresStage, eq(candidatures.idOffre, offresStage.idOffre))
    .leftJoin(
      affectationsSuperviseurStage,
      eq(affectationsSuperviseurStage.idStage, stages.idStage),
    )
    .leftJoin(
      membresEquipe,
      eq(membresEquipe.idMembre, affectationsSuperviseurStage.idMembre),
    )
    .where(eq(stages.idEntreprise, entreprise.idEntreprise));
}

export async function affecterSuperviseur(
  idUtilisateurEntreprise,
  { idStage, idMembre },
) {
  const entreprise = await getEntrepriseOrThrow(idUtilisateurEntreprise);
  const admin = await getOrCreateAdminPrincipal(
    entreprise.idEntreprise,
    idUtilisateurEntreprise,
  );

  const [stage] = await db
    .select()
    .from(stages)
    .where(
      and(
        eq(stages.idStage, idStage),
        eq(stages.idEntreprise, entreprise.idEntreprise),
      ),
    );
  if (!stage) {
    const err = new Error("Stage introuvable");
    err.status = 404;
    throw err;
  }

  const membre = await getMembreEntrepriseOrThrow(
    entreprise.idEntreprise,
    idMembre,
  );
  if (membre.statutMembre !== "actif") {
    const err = new Error(
      "Seul un membre actif peut être affecté comme superviseur.",
    );
    err.status = 409;
    throw err;
  }

  const [existante] = await db
    .select()
    .from(affectationsSuperviseurStage)
    .where(eq(affectationsSuperviseurStage.idStage, idStage));

  const [affectation] = existante
    ? await db
        .update(affectationsSuperviseurStage)
        .set({ idMembre, dateAffectation: new Date() })
        .where(eq(affectationsSuperviseurStage.idStage, idStage))
        .returning()
    : await db
        .insert(affectationsSuperviseurStage)
        .values({ idStage, idMembre })
        .returning();

  await enregistrerActivite(
    entreprise.idEntreprise,
    admin.idMembre,
    "stagiaire_affecte",
    `${membre.nom} affecté au suivi du stage ${idStage}`,
  );

  return affectation;
}

export async function retirerAffectation(idUtilisateurEntreprise, idStage) {
  const entreprise = await getEntrepriseOrThrow(idUtilisateurEntreprise);
  const admin = await getOrCreateAdminPrincipal(
    entreprise.idEntreprise,
    idUtilisateurEntreprise,
  );

  const [stage] = await db
    .select()
    .from(stages)
    .where(
      and(
        eq(stages.idStage, idStage),
        eq(stages.idEntreprise, entreprise.idEntreprise),
      ),
    );
  if (!stage) {
    const err = new Error("Stage introuvable");
    err.status = 404;
    throw err;
  }

  await db
    .delete(affectationsSuperviseurStage)
    .where(eq(affectationsSuperviseurStage.idStage, idStage));

  await enregistrerActivite(
    entreprise.idEntreprise,
    admin.idMembre,
    "affectation_retiree",
    `Affectation retirée pour le stage ${idStage}`,
  );

  return { deleted: true };
}

// -----------------------------------------------------------------------
// Historique des activités
// -----------------------------------------------------------------------

export async function listActivites(
  idUtilisateurEntreprise,
  { limit = 50 } = {},
) {
  const entreprise = await getEntrepriseOrThrow(idUtilisateurEntreprise);

  return db
    .select({
      idActivite: activitesEquipe.idActivite,
      action: activitesEquipe.action,
      details: activitesEquipe.details,
      dateAction: activitesEquipe.dateAction,
      nomAuteur: membresEquipe.nom,
    })
    .from(activitesEquipe)
    .leftJoin(
      membresEquipe,
      eq(membresEquipe.idMembre, activitesEquipe.idMembre),
    )
    .where(eq(activitesEquipe.idEntreprise, entreprise.idEntreprise))
    .orderBy(desc(activitesEquipe.dateAction))
    .limit(limit);
}

// -----------------------------------------------------------------------
// Paramètres de l'équipe
// -----------------------------------------------------------------------

export async function getParametresEquipe(idUtilisateurEntreprise) {
  const entreprise = await getEntrepriseOrThrow(idUtilisateurEntreprise);
  return getParametresOuDefaut(entreprise.idEntreprise);
}

export async function updateParametresEquipe(idUtilisateurEntreprise, payload) {
  const entreprise = await getEntrepriseOrThrow(idUtilisateurEntreprise);
  const admin = await getOrCreateAdminPrincipal(
    entreprise.idEntreprise,
    idUtilisateurEntreprise,
  );

  const [existant] = await db
    .select()
    .from(parametresEquipeEntreprise)
    .where(
      eq(parametresEquipeEntreprise.idEntreprise, entreprise.idEntreprise),
    );

  const [parametres] = existant
    ? await db
        .update(parametresEquipeEntreprise)
        .set(payload)
        .where(
          eq(parametresEquipeEntreprise.idEntreprise, entreprise.idEntreprise),
        )
        .returning()
    : await db
        .insert(parametresEquipeEntreprise)
        .values({ idEntreprise: entreprise.idEntreprise, ...payload })
        .returning();

  await enregistrerActivite(
    entreprise.idEntreprise,
    admin.idMembre,
    "parametres_equipe_modifies",
    null,
  );

  return parametres;
}

// -----------------------------------------------------------------------
// Acceptation d'invitation — flux public (non authentifié), consommé par la
// page /invitation/[token]. Crée le compte de connexion du membre et
// l'active, contrairement à registerUser (auth.service.js) qui laisse le
// compte "inactif" en attendant l'onboarding : ici il n'y a pas d'onboarding,
// le membre existe déjà (créé au moment de l'invitation).
// -----------------------------------------------------------------------

export async function getInvitationParToken(token) {
  const [membre] = await db
    .select({
      idMembre: membresEquipe.idMembre,
      nom: membresEquipe.nom,
      email: membresEquipe.email,
      roleEquipe: membresEquipe.roleEquipe,
      statutMembre: membresEquipe.statutMembre,
      dateExpirationInvitation: membresEquipe.dateExpirationInvitation,
      nomEntreprise: entreprises.nomEntreprise,
    })
    .from(membresEquipe)
    .innerJoin(
      entreprises,
      eq(entreprises.idEntreprise, membresEquipe.idEntreprise),
    )
    .where(eq(membresEquipe.tokenInvitation, token));

  if (!membre || membre.statutMembre !== "invite") {
    const err = new Error("Invitation introuvable ou déjà utilisée.");
    err.status = 404;
    throw err;
  }
  if (
    membre.dateExpirationInvitation &&
    membre.dateExpirationInvitation < new Date()
  ) {
    const err = new Error(
      "Cette invitation a expiré. Demandez-en une nouvelle.",
    );
    err.status = 410;
    throw err;
  }

  const { statutMembre, dateExpirationInvitation, ...infosPubliques } = membre;
  return infosPubliques;
}

export async function accepterInvitation(token, motDePasse) {
  const [membre] = await db
    .select()
    .from(membresEquipe)
    .where(eq(membresEquipe.tokenInvitation, token));

  if (!membre || membre.statutMembre !== "invite") {
    const err = new Error("Invitation introuvable ou déjà utilisée.");
    err.status = 404;
    throw err;
  }
  if (
    membre.dateExpirationInvitation &&
    membre.dateExpirationInvitation < new Date()
  ) {
    const err = new Error(
      "Cette invitation a expiré. Demandez-en une nouvelle.",
    );
    err.status = 410;
    throw err;
  }

  const [compteExistant] = await db
    .select()
    .from(utilisateurs)
    .where(eq(utilisateurs.email, membre.email));
  if (compteExistant) {
    const err = new Error("Un compte existe déjà avec cette adresse email.");
    err.status = 409;
    throw err;
  }

  const motDePasseHash = await hashPassword(motDePasse);

  const nouvelUtilisateur = await db.transaction(async (tx) => {
    const [utilisateur] = await tx
      .insert(utilisateurs)
      .values({
        email: membre.email,
        motDePasseHash,
        typeUtilisateur: "membre_entreprise",
        methodeConnexion: "email",
        statutCompte: "actif",
      })
      .returning();

    await tx
      .update(membresEquipe)
      .set({
        idUtilisateur: utilisateur.idUtilisateur,
        statutMembre: "actif",
        dateActivation: new Date(),
        tokenInvitation: null,
        dateExpirationInvitation: null,
      })
      .where(eq(membresEquipe.idMembre, membre.idMembre));

    return utilisateur;
  });

  await enregistrerActivite(
    membre.idEntreprise,
    membre.idMembre,
    "invitation_acceptee",
    `${membre.nom} (${membre.email}) a rejoint l'équipe`,
  );

  const { motDePasseHash: _omit, ...utilisateurSansHash } = nouvelUtilisateur;
  const token_ = signToken({
    idUtilisateur: nouvelUtilisateur.idUtilisateur,
    typeUtilisateur: nouvelUtilisateur.typeUtilisateur,
  });

  return { user: utilisateurSansHash, token: token_ };
}

// Profil du membre actuellement connecté (utilisé par le frontend pour
// afficher son nom/rôle dans la barre latérale, et par le module
// "superviseur" pour résoudre idMembre à partir du JWT).
export async function getMonProfil(idUtilisateur) {
  const [membre] = await db
    .select({
      idMembre: membresEquipe.idMembre,
      nom: membresEquipe.nom,
      email: membresEquipe.email,
      roleEquipe: membresEquipe.roleEquipe,
      estAdminPrincipal: membresEquipe.estAdminPrincipal,
      nomEntreprise: entreprises.nomEntreprise,
    })
    .from(membresEquipe)
    .innerJoin(
      entreprises,
      eq(entreprises.idEntreprise, membresEquipe.idEntreprise),
    )
    .where(eq(membresEquipe.idUtilisateur, idUtilisateur));

  if (!membre) {
    const err = new Error("Profil membre introuvable");
    err.status = 404;
    throw err;
  }
  return membre;
}
