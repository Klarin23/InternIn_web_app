import { eq, and, desc, ne, sql, inArray } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  conversations,
  messages,
  stages,
  stagiaires,
  entreprises,
  utilisateurs,
  affectationsSuperviseurStage,
  membresEquipe,
} from "../../db/schema.js";
import {
  getStageLifecycleStatus,
  isStageActivelyRunning,
} from "../../utils/stageLifecycle.js";
import { resolveSupervisionAccess } from "../superviseur/superviseur.service.js";

// ---------------------------------------------------------------------------
// Helpers identité
// ---------------------------------------------------------------------------

async function resolveStagiaire(idUtilisateur) {
  const [row] = await db
    .select()
    .from(stagiaires)
    .where(eq(stagiaires.idUtilisateur, idUtilisateur));
  return row || null;
}

async function resolveEntreprise(idUtilisateur) {
  const [row] = await db
    .select()
    .from(entreprises)
    .where(eq(entreprises.idUtilisateur, idUtilisateur));
  return row || null;
}

function forbidden(message = "Accès refusé") {
  const err = new Error(message);
  err.status = 403;
  return err;
}

function notFound(message = "Ressource introuvable") {
  const err = new Error(message);
  err.status = 404;
  return err;
}

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}


/**
 * Vérifie qu'un membre d'équipe (superviseur / admin) peut accéder au stage.
 * - mode superviseur : affectation obligatoire sur ce stage
 * - mode entreprise / admin_entreprise : stage de son idEntreprise uniquement
 */
async function assertMembrePeutAccederStage(idUtilisateur, idStage, idEntrepriseStage) {
  let access;
  try {
    access = await resolveSupervisionAccess(idUtilisateur);
  } catch {
    throw forbidden("Vous n'êtes pas autorisé à accéder à cette conversation");
  }

  if (access.idEntreprise !== idEntrepriseStage) {
    throw forbidden("Vous n'êtes pas autorisé à accéder à cette conversation");
  }

  if (access.mode === "superviseur") {
    if (!access.idMembre) {
      throw forbidden("Vous n'êtes pas autorisé à accéder à cette conversation");
    }
    const [aff] = await db
      .select({ idAffectation: affectationsSuperviseurStage.idAffectation })
      .from(affectationsSuperviseurStage)
      .where(
        and(
          eq(affectationsSuperviseurStage.idMembre, access.idMembre),
          eq(affectationsSuperviseurStage.idStage, idStage),
        ),
      )
      .limit(1);
    if (!aff) {
      throw forbidden(
        "Ce stage ne vous est pas affecté. La messagerie est réservée aux stagiaires que vous supervisez.",
      );
    }
  }
  // mode entreprise / admin_entreprise : périmètre idEntreprise déjà vérifié
  return access;
}

/**
 * Liste les idStage accessibles pour un membre (affectation) ou tous ceux
 * de l'entreprise pour admin / compte entreprise résolu via access.
 */
async function listStageIdsForSupervisionAccess(access) {
  if (access.mode === "superviseur" && access.idMembre) {
    const rows = await db
      .select({ idStage: affectationsSuperviseurStage.idStage })
      .from(affectationsSuperviseurStage)
      .where(eq(affectationsSuperviseurStage.idMembre, access.idMembre));
    return rows.map((r) => r.idStage);
  }
  // entreprise propriétaire ou admin_entreprise : tous les stages de l'entreprise
  const rows = await db
    .select({ idStage: stages.idStage })
    .from(stages)
    .where(eq(stages.idEntreprise, access.idEntreprise));
  return rows.map((r) => r.idStage);
}

/**
 * Crée les conversations manquantes pour des stages dont le cycle de vie
 * est "actif" (dates), même si le statut stocké n'a pas encore été basculé.
 * Sécurité : idStage doit déjà être filtré au périmètre de l'appelant.
 */
/**
 * getOrCreateConversation — idempotent via contrainte unique partielle DB.
 * @param {{ idStage: string, typeConversation: 'entreprise'|'superviseur', idEntreprise: string, idMembreEntreprise?: string|null }}
 */
async function getOrCreateConversation({
  idStage,
  typeConversation,
  idEntreprise,
  idMembreEntreprise = null,
}) {
  const conditions = [
    eq(conversations.idStage, idStage),
    eq(conversations.typeConversation, typeConversation),
  ];
  if (typeConversation === "superviseur") {
    conditions.push(eq(conversations.idMembreEntreprise, idMembreEntreprise));
  }

  const [existing] = await db
    .select()
    .from(conversations)
    .where(and(...conditions))
    .limit(1);
  if (existing) return existing;

  try {
    const [created] = await db
      .insert(conversations)
      .values({
        idStage,
        typeConversation,
        idEntreprise,
        idMembreEntreprise:
          typeConversation === "superviseur" ? idMembreEntreprise : null,
        statut: "active",
      })
      .returning();
    return created;
  } catch {
    // Course concurrente : relire
    const [again] = await db
      .select()
      .from(conversations)
      .where(and(...conditions))
      .limit(1);
    return again || null;
  }
}

/**
 * Assure les conversations manquantes pour des stages actifs.
 * @param {Array} stageRows — stages avec métadonnées d'affichage
 * @param {Array} existingRows — conversations déjà chargées (muté)
 * @param {{ typeConversation: 'entreprise'|'superviseur', idEntreprise: string, idMembreEntreprise?: string|null }} owner
 */
async function ensureConversationsForActiveStages(
  stageRows,
  existingRows,
  owner,
) {
  const keyOf = (r) =>
    `${r.idStage}|${r.typeConversation || owner.typeConversation}|${r.idMembreEntreprise || owner.idMembreEntreprise || ""}`;

  const existingKeys = new Set(
    existingRows.map((r) =>
      `${r.idStage}|${r.typeConversation || owner.typeConversation}|${r.idMembreEntreprise || owner.idMembreEntreprise || ""}`,
    ),
  );

  const toCreate = stageRows.filter(
    (s) =>
      !existingKeys.has(
        `${s.idStage}|${owner.typeConversation}|${owner.idMembreEntreprise || ""}`,
      ) &&
      isStageActivelyRunning({
        statut: s.statutStage ?? s.statut,
        dateDebut: s.dateDebut,
        dateFinPrevue: s.dateFinPrevue,
      }),
  );

  for (const s of toCreate) {
    const created = await getOrCreateConversation({
      idStage: s.idStage,
      typeConversation: owner.typeConversation,
      idEntreprise: owner.idEntreprise || s.idEntreprise,
      idMembreEntreprise: owner.idMembreEntreprise,
    });
    if (created && !existingKeys.has(keyOf({ ...created, ...owner, idStage: s.idStage }))) {
      existingRows.push({
        idConversation: created.idConversation,
        typeConversation: created.typeConversation,
        idMembreEntreprise: created.idMembreEntreprise,
        statut: created.statut,
        dateCreation: created.dateCreation,
        idStage: s.idStage,
        statutStage: s.statutStage ?? s.statut,
        dateDebut: s.dateDebut,
        dateFinPrevue: s.dateFinPrevue,
        prenom: s.prenom,
        nom: s.nom,
        photoProfilUrl: s.photoProfilUrl,
        idUtilisateurStagiaire: s.idUtilisateurStagiaire,
        nomEntreprise: s.nomEntreprise,
        logoUrl: s.logoUrl,
        secteurActivite: s.secteurActivite,
      });
      existingKeys.add(
        `${s.idStage}|${owner.typeConversation}|${owner.idMembreEntreprise || ""}`,
      );
    }
  }
  return existingRows;
}


/**
 * Vérifie si le stage autorise l'envoi de messages.
 * Règle métier : uniquement pendant la période active (dates + statut).
 * Accepte soit un statut string, soit un objet stage { statut, dateDebut, dateFinPrevue }.
 */
function resolveLifecycleStatus(statutOrStage) {
  if (statutOrStage && typeof statutOrStage === "object") {
    return getStageLifecycleStatus(statutOrStage);
  }
  // Fallback string : si "a_venir" / "actif" / etc. déjà effectif
  return statutOrStage;
}

function canSendMessages(statutOrStage) {
  return resolveLifecycleStatus(statutOrStage) === "actif";
}

function canReadMessages(statutOrStage) {
  const s = resolveLifecycleStatus(statutOrStage);
  // Historique lisible même après fin / interruption ; pas avant le début
  return s === "actif" || s === "termine" || s === "interrompu";
}

// ---------------------------------------------------------------------------
// Accès conversation (anti-IDOR)
// ---------------------------------------------------------------------------

/**
 * Résout une conversation et vérifie que l'utilisateur y a accès
 * (stagiaire du stage OU entreprise propriétaire du stage).
 * Ne se base JAMAIS uniquement sur l'idConversation fourni par le client.
 */
async function assertConversationAccess(idUtilisateur, typeUtilisateur, idConversation) {
  const [row] = await db
    .select({
      idConversation: conversations.idConversation,
      statutConversation: conversations.statut,
      typeConversation: conversations.typeConversation,
      idMembreEntreprise: conversations.idMembreEntreprise,
      idEntrepriseConv: conversations.idEntreprise,
      idStage: stages.idStage,
      statutStage: stages.statut,
      dateDebut: stages.dateDebut,
      dateFinPrevue: stages.dateFinPrevue,
      idStagiaire: stages.idStagiaire,
      idEntreprise: stages.idEntreprise,
      idUtilisateurStagiaire: stagiaires.idUtilisateur,
      prenom: stagiaires.prenom,
      nom: stagiaires.nom,
      photoProfilUrl: stagiaires.photoProfilUrl,
      nomEntreprise: entreprises.nomEntreprise,
      logoUrl: entreprises.logoUrl,
      secteurActivite: entreprises.secteurActivite,
    })
    .from(conversations)
    .innerJoin(stages, eq(conversations.idStage, stages.idStage))
    .innerJoin(stagiaires, eq(stages.idStagiaire, stagiaires.idStagiaire))
    .innerJoin(entreprises, eq(stages.idEntreprise, entreprises.idEntreprise))
    .where(eq(conversations.idConversation, idConversation));

  if (!row) throw notFound("Conversation introuvable");

  if (typeUtilisateur === "stagiaire") {
    if (row.idUtilisateurStagiaire !== idUtilisateur) {
      throw forbidden("Vous n'êtes pas autorisé à accéder à cette conversation");
    }
  } else if (typeUtilisateur === "entreprise") {
    // Compte propriétaire entreprise : uniquement conversations type entreprise
    if (row.typeConversation !== "entreprise") {
      throw forbidden("Vous n'êtes pas autorisé à accéder à cette conversation");
    }
    const entreprise = await resolveEntreprise(idUtilisateur);
    const idEnt = row.idEntrepriseConv || row.idEntreprise;
    if (!entreprise || entreprise.idEntreprise !== idEnt) {
      throw forbidden("Vous n'êtes pas autorisé à accéder à cette conversation");
    }
  } else if (typeUtilisateur === "membre_entreprise") {
    // Superviseur / membre : uniquement SA conversation superviseur
    if (row.typeConversation !== "superviseur") {
      throw forbidden("Vous n'êtes pas autorisé à accéder à cette conversation");
    }
    let access;
    try {
      access = await resolveSupervisionAccess(idUtilisateur);
    } catch {
      throw forbidden("Vous n'êtes pas autorisé à accéder à cette conversation");
    }
    if (access.idMembre && row.idMembreEntreprise !== access.idMembre) {
      throw forbidden("Vous n'êtes pas autorisé à accéder à cette conversation");
    }
    // Admin entreprise avec mode admin : peut accéder si même entreprise + affectation stage
    if (access.mode === "admin_entreprise" || access.mode === "entreprise") {
      // Admin : autorisé si périmètre stage OK (pas la conversation entreprise)
      await assertMembrePeutAccederStage(idUtilisateur, row.idStage, row.idEntreprise);
      // Mais uniquement conversation superviseur liée à ce membre si idMembre défini
      if (access.idMembre && row.idMembreEntreprise !== access.idMembre) {
        throw forbidden("Vous n'êtes pas autorisé à accéder à cette conversation");
      }
    } else {
      await assertMembrePeutAccederStage(idUtilisateur, row.idStage, row.idEntreprise);
    }
  } else {
    throw forbidden("Rôle non autorisé pour la messagerie");
  }

  if (!canReadMessages({ statut: row.statutStage, dateDebut: row.dateDebut, dateFinPrevue: row.dateFinPrevue })) {
    throw forbidden("Messagerie indisponible pour ce stage");
  }

  return row;
}

// ---------------------------------------------------------------------------
// Liste conversations — Stagiaire
// ---------------------------------------------------------------------------

export async function listConversationsStagiaire(idUtilisateur) {
  const stagiaire = await resolveStagiaire(idUtilisateur);
  if (!stagiaire) return [];

  const rows = await db
    .select({
      idConversation: conversations.idConversation,
      typeConversation: conversations.typeConversation,
      idMembreEntreprise: conversations.idMembreEntreprise,
      statut: conversations.statut,
      dateCreation: conversations.dateCreation,
      idStage: stages.idStage,
      idEntreprise: stages.idEntreprise,
      statutStage: stages.statut,
      dateDebut: stages.dateDebut,
      dateFinPrevue: stages.dateFinPrevue,
      nomEntreprise: entreprises.nomEntreprise,
      logoUrl: entreprises.logoUrl,
      secteurActivite: entreprises.secteurActivite,
      idUtilisateurProprietaire: entreprises.idUtilisateur,
      // Superviseur (si conversation type superviseur)
      nomMembre: membresEquipe.nom,
      emailMembre: membresEquipe.email,
      idMembre: membresEquipe.idMembre,
    })
    .from(conversations)
    .innerJoin(stages, eq(conversations.idStage, stages.idStage))
    .innerJoin(entreprises, eq(stages.idEntreprise, entreprises.idEntreprise))
    .leftJoin(
      membresEquipe,
      eq(conversations.idMembreEntreprise, membresEquipe.idMembre),
    )
    .where(eq(stages.idStagiaire, stagiaire.idStagiaire))
    .orderBy(desc(conversations.dateCreation));

  const mesStages = await db
    .select({
      idStage: stages.idStage,
      idEntreprise: stages.idEntreprise,
      statutStage: stages.statut,
      dateDebut: stages.dateDebut,
      dateFinPrevue: stages.dateFinPrevue,
      nomEntreprise: entreprises.nomEntreprise,
      logoUrl: entreprises.logoUrl,
      secteurActivite: entreprises.secteurActivite,
    })
    .from(stages)
    .innerJoin(entreprises, eq(stages.idEntreprise, entreprises.idEntreprise))
    .where(eq(stages.idStagiaire, stagiaire.idStagiaire));

  // 1) Conversations entreprise manquantes
  for (const s of mesStages) {
    await ensureConversationsForActiveStages([s], rows, {
      typeConversation: "entreprise",
      idEntreprise: s.idEntreprise,
      idMembreEntreprise: null,
    });
  }

  // 2) Conversations superviseur pour chaque affectation
  if (mesStages.length) {
    const stageIds = mesStages.map((s) => s.idStage);
    const affectations = await db
      .select({
        idStage: affectationsSuperviseurStage.idStage,
        idMembre: affectationsSuperviseurStage.idMembre,
        idEntreprise: stages.idEntreprise,
      })
      .from(affectationsSuperviseurStage)
      .innerJoin(stages, eq(affectationsSuperviseurStage.idStage, stages.idStage))
      .where(inArray(affectationsSuperviseurStage.idStage, stageIds));

    const stageById = Object.fromEntries(mesStages.map((s) => [s.idStage, s]));
    for (const a of affectations) {
      const s = stageById[a.idStage];
      if (!s) continue;
      await ensureConversationsForActiveStages([s], rows, {
        typeConversation: "superviseur",
        idEntreprise: a.idEntreprise,
        idMembreEntreprise: a.idMembre,
      });
    }
  }

  // Propriétaires entreprise (batch, anti N+1)
  const entrepriseIds = [
    ...new Set(
      rows
        .filter((r) => (r.typeConversation || "entreprise") === "entreprise")
        .map((r) => r.idEntreprise)
        .filter(Boolean),
    ),
  ];
  let ownerByEntreprise = {};
  if (entrepriseIds.length) {
    const ownerRows = await db
      .select({
        idEntreprise: entreprises.idEntreprise,
        nomMembre: membresEquipe.nom,
        idMembre: membresEquipe.idMembre,
        idUtilisateur: entreprises.idUtilisateur,
      })
      .from(entreprises)
      .leftJoin(
        membresEquipe,
        eq(membresEquipe.idUtilisateur, entreprises.idUtilisateur),
      )
      .where(inArray(entreprises.idEntreprise, entrepriseIds));
    ownerByEntreprise = Object.fromEntries(
      ownerRows.map((o) => [o.idEntreprise, o]),
    );
  }

  const shaped = rows.map((r) => {
    const type = r.typeConversation || "entreprise";
    const base = {
      ...r,
      typeConversation: type,
    };
    if (type === "superviseur") {
      const nomComplet = (r.nomMembre || "").trim() || null;
      return {
        ...base,
        interlocuteur: {
          type: "superviseur",
          nomComplet,
          titreKey: "messages.roleSupervisor",
        },
        entreprise: {
          id: r.idEntreprise,
          nom: r.nomEntreprise,
          logoUrl: r.logoUrl,
        },
        // Champs plats pour le frontend existant
        titrePrincipal: nomComplet,
        titreSecondaire: r.nomEntreprise,
        roleKey: "messages.roleSupervisor",
        avatarUrl: null,
        avatarKind: "person",
        initialsSource: nomComplet || r.nomEntreprise,
      };
    }
    const owner = ownerByEntreprise[r.idEntreprise];
    const ownerName = (owner?.nomMembre || "").trim() || null;
    return {
      ...base,
      interlocuteur: {
        type: "entreprise",
        nomComplet: ownerName,
        titreKey: "messages.roleBusinessOwner",
      },
      entreprise: {
        id: r.idEntreprise,
        nom: r.nomEntreprise,
        logoUrl: r.logoUrl,
      },
      titrePrincipal: r.nomEntreprise,
      titreSecondaire: ownerName,
      roleKey: "messages.roleBusinessOwner",
      avatarUrl: r.logoUrl || null,
      avatarKind: "company",
      initialsSource: r.nomEntreprise,
    };
  });

  return enrichConversations(shaped, idUtilisateur);
}

// ---------------------------------------------------------------------------
// Liste conversations — Entreprise
// ---------------------------------------------------------------------------

export async function listConversationsEntreprise(idUtilisateur) {
  const entreprise = await resolveEntreprise(idUtilisateur);
  if (!entreprise) return [];

  // Uniquement conversations type entreprise de cette entreprise
  const rows = await db
    .select({
      idConversation: conversations.idConversation,
      typeConversation: conversations.typeConversation,
      idMembreEntreprise: conversations.idMembreEntreprise,
      statut: conversations.statut,
      dateCreation: conversations.dateCreation,
      idStage: stages.idStage,
      statutStage: stages.statut,
      dateDebut: stages.dateDebut,
      dateFinPrevue: stages.dateFinPrevue,
      prenom: stagiaires.prenom,
      nom: stagiaires.nom,
      photoProfilUrl: stagiaires.photoProfilUrl,
      idUtilisateurStagiaire: stagiaires.idUtilisateur,
    })
    .from(conversations)
    .innerJoin(stages, eq(conversations.idStage, stages.idStage))
    .innerJoin(stagiaires, eq(stages.idStagiaire, stagiaires.idStagiaire))
    .where(
      and(
        eq(conversations.typeConversation, "entreprise"),
        eq(stages.idEntreprise, entreprise.idEntreprise),
      ),
    )
    .orderBy(desc(conversations.dateCreation));

  const stagesEntreprise = await db
    .select({
      idStage: stages.idStage,
      idEntreprise: stages.idEntreprise,
      statutStage: stages.statut,
      dateDebut: stages.dateDebut,
      dateFinPrevue: stages.dateFinPrevue,
      prenom: stagiaires.prenom,
      nom: stagiaires.nom,
      photoProfilUrl: stagiaires.photoProfilUrl,
      idUtilisateurStagiaire: stagiaires.idUtilisateur,
    })
    .from(stages)
    .innerJoin(stagiaires, eq(stages.idStagiaire, stagiaires.idStagiaire))
    .where(eq(stages.idEntreprise, entreprise.idEntreprise));

  await ensureConversationsForActiveStages(stagesEntreprise, rows, {
    typeConversation: "entreprise",
    idEntreprise: entreprise.idEntreprise,
    idMembreEntreprise: null,
  });

  return enrichConversations(rows, idUtilisateur);
}


async function enrichConversations(rows, idUtilisateur) {
  const enriched = await Promise.all(
    rows.map(async (row) => {
      const [lastMsg] = await db
        .select({
          idMessage: messages.idMessage,
          contenu: messages.contenu,
          dateEnvoi: messages.dateEnvoi,
          idExpediteur: messages.idExpediteur,
          statutLecture: messages.statutLecture,
        })
        .from(messages)
        .where(eq(messages.idConversation, row.idConversation))
        .orderBy(desc(messages.dateEnvoi))
        .limit(1);

      const [unread] = await db
        .select({ count: sql`count(*)::int` })
        .from(messages)
        .where(
          and(
            eq(messages.idConversation, row.idConversation),
            ne(messages.idExpediteur, idUtilisateur),
            eq(messages.statutLecture, "envoye"),
          ),
        );

      return {
        ...row,
        typeConversation: row.typeConversation || "entreprise",
        dernierMessage: lastMsg || null,
        nonLus: unread?.count ?? 0,
        messagerieActive: canSendMessages({ statut: row.statutStage, dateDebut: row.dateDebut, dateFinPrevue: row.dateFinPrevue }),
        lectureSeule: !canSendMessages({ statut: row.statutStage, dateDebut: row.dateDebut, dateFinPrevue: row.dateFinPrevue }) && canReadMessages({ statut: row.statutStage, dateDebut: row.dateDebut, dateFinPrevue: row.dateFinPrevue }),
      };
    }),
  );

  enriched.sort((a, b) => {
    const da = a.dernierMessage?.dateEnvoi
      ? new Date(a.dernierMessage.dateEnvoi).getTime()
      : new Date(a.dateCreation).getTime();
    const db_ = b.dernierMessage?.dateEnvoi
      ? new Date(b.dernierMessage.dateEnvoi).getTime()
      : new Date(b.dateCreation).getTime();
    return db_ - da;
  });

  return enriched;
}

// ---------------------------------------------------------------------------
// Dispatcher liste selon rôle
// ---------------------------------------------------------------------------

/**
 * Conversations pour membre d'équipe (superviseur affecté / admin entreprise).
 * Périmètre strict via resolveSupervisionAccess + affectations.
 */
export async function listConversationsMembreEntreprise(idUtilisateur) {
  let access;
  try {
    access = await resolveSupervisionAccess(idUtilisateur);
  } catch {
    return [];
  }

  // Propriétaire entreprise (mode entreprise) : utiliser la boîte entreprise
  if (access.mode === "entreprise") {
    return listConversationsEntreprise(idUtilisateur);
  }

  if (!access.idMembre) return [];

  const stageIds = await listStageIdsForSupervisionAccess(access);
  if (!stageIds.length) return [];

  // Uniquement conversations superviseur de CE membre
  const rows = await db
    .select({
      idConversation: conversations.idConversation,
      typeConversation: conversations.typeConversation,
      idMembreEntreprise: conversations.idMembreEntreprise,
      statut: conversations.statut,
      dateCreation: conversations.dateCreation,
      idStage: stages.idStage,
      statutStage: stages.statut,
      dateDebut: stages.dateDebut,
      dateFinPrevue: stages.dateFinPrevue,
      prenom: stagiaires.prenom,
      nom: stagiaires.nom,
      photoProfilUrl: stagiaires.photoProfilUrl,
      idUtilisateurStagiaire: stagiaires.idUtilisateur,
    })
    .from(conversations)
    .innerJoin(stages, eq(conversations.idStage, stages.idStage))
    .innerJoin(stagiaires, eq(stages.idStagiaire, stagiaires.idStagiaire))
    .where(
      and(
        eq(conversations.typeConversation, "superviseur"),
        eq(conversations.idMembreEntreprise, access.idMembre),
        eq(stages.idEntreprise, access.idEntreprise),
        inArray(stages.idStage, stageIds),
      ),
    )
    .orderBy(desc(conversations.dateCreation));

  const stagesPerimetre = await db
    .select({
      idStage: stages.idStage,
      idEntreprise: stages.idEntreprise,
      statutStage: stages.statut,
      dateDebut: stages.dateDebut,
      dateFinPrevue: stages.dateFinPrevue,
      prenom: stagiaires.prenom,
      nom: stagiaires.nom,
      photoProfilUrl: stagiaires.photoProfilUrl,
      idUtilisateurStagiaire: stagiaires.idUtilisateur,
    })
    .from(stages)
    .innerJoin(stagiaires, eq(stages.idStagiaire, stagiaires.idStagiaire))
    .where(
      and(
        eq(stages.idEntreprise, access.idEntreprise),
        inArray(stages.idStage, stageIds),
      ),
    );

  await ensureConversationsForActiveStages(stagesPerimetre, rows, {
    typeConversation: "superviseur",
    idEntreprise: access.idEntreprise,
    idMembreEntreprise: access.idMembre,
  });

  return enrichConversations(rows, idUtilisateur);
}


export async function listConversations(idUtilisateur, typeUtilisateur) {
  if (typeUtilisateur === "stagiaire") {
    return listConversationsStagiaire(idUtilisateur);
  }
  if (typeUtilisateur === "entreprise") {
    return listConversationsEntreprise(idUtilisateur);
  }
  if (typeUtilisateur === "membre_entreprise") {
    return listConversationsMembreEntreprise(idUtilisateur);
  }
  return [];
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export async function listMessages(idUtilisateur, typeUtilisateur, idConversation) {
  await assertConversationAccess(idUtilisateur, typeUtilisateur, idConversation);

  return db
    .select({
      idMessage: messages.idMessage,
      idConversation: messages.idConversation,
      idExpediteur: messages.idExpediteur,
      contenu: messages.contenu,
      statutLecture: messages.statutLecture,
      dateEnvoi: messages.dateEnvoi,
    })
    .from(messages)
    .where(eq(messages.idConversation, idConversation))
    .orderBy(messages.dateEnvoi);
}

/**
 * Envoi de message — règle absolue : stage.statut === "actif"
 */
export async function envoyerMessage(
  idUtilisateur,
  typeUtilisateur,
  idConversation,
  contenu,
) {
  const text = typeof contenu === "string" ? contenu.trim() : "";
  if (!text) throw badRequest("Le message ne peut pas être vide");
  if (text.length > 5000) throw badRequest("Message trop long (max 5000 caractères)");

  const ctx = await assertConversationAccess(
    idUtilisateur,
    typeUtilisateur,
    idConversation,
  );

  if (!canSendMessages({ statut: ctx.statutStage, dateDebut: ctx.dateDebut, dateFinPrevue: ctx.dateFinPrevue })) {
    throw forbidden(
      "Messagerie indisponible : le stage n'est pas actif. Aucun message ne peut être envoyé.",
    );
  }

  const [msg] = await db
    .insert(messages)
    .values({
      idConversation,
      idExpediteur: idUtilisateur,
      contenu: text,
      statutLecture: "envoye",
    })
    .returning({
      idMessage: messages.idMessage,
      idConversation: messages.idConversation,
      idExpediteur: messages.idExpediteur,
      contenu: messages.contenu,
      statutLecture: messages.statutLecture,
      dateEnvoi: messages.dateEnvoi,
    });

  return msg;
}

export async function marquerCommeLus(idUtilisateur, typeUtilisateur, idConversation) {
  await assertConversationAccess(idUtilisateur, typeUtilisateur, idConversation);

  await db
    .update(messages)
    .set({ statutLecture: "lu" })
    .where(
      and(
        eq(messages.idConversation, idConversation),
        ne(messages.idExpediteur, idUtilisateur),
        eq(messages.statutLecture, "envoye"),
      ),
    );

  return { ok: true };
}

export async function compterNonLus(idUtilisateur, typeUtilisateur) {
  if (typeUtilisateur === "stagiaire") {
    const stagiaire = await resolveStagiaire(idUtilisateur);
    if (!stagiaire) return { count: 0 };

    const [result] = await db
      .select({ count: sql`count(*)::int` })
      .from(messages)
      .innerJoin(
        conversations,
        eq(messages.idConversation, conversations.idConversation),
      )
      .innerJoin(stages, eq(conversations.idStage, stages.idStage))
      .where(
        and(
          eq(stages.idStagiaire, stagiaire.idStagiaire),
          ne(messages.idExpediteur, idUtilisateur),
          eq(messages.statutLecture, "envoye"),
        ),
      );
    return { count: result?.count ?? 0 };
  }

  if (typeUtilisateur === "entreprise") {
    const entreprise = await resolveEntreprise(idUtilisateur);
    if (!entreprise) return { count: 0 };

    const [result] = await db
      .select({ count: sql`count(*)::int` })
      .from(messages)
      .innerJoin(
        conversations,
        eq(messages.idConversation, conversations.idConversation),
      )
      .innerJoin(stages, eq(conversations.idStage, stages.idStage))
      .where(
        and(
          eq(conversations.typeConversation, "entreprise"),
          eq(stages.idEntreprise, entreprise.idEntreprise),
          ne(messages.idExpediteur, idUtilisateur),
          eq(messages.statutLecture, "envoye"),
        ),
      );
    return { count: result?.count ?? 0 };
  }

  if (typeUtilisateur === "membre_entreprise") {
    let access;
    try {
      access = await resolveSupervisionAccess(idUtilisateur);
    } catch {
      return { count: 0 };
    }
    if (access.mode === "entreprise") {
      return compterNonLus(idUtilisateur, "entreprise");
    }
    if (!access.idMembre) return { count: 0 };
    const stageIds = await listStageIdsForSupervisionAccess(access);
    if (!stageIds.length) return { count: 0 };

    const [result] = await db
      .select({ count: sql`count(*)::int` })
      .from(messages)
      .innerJoin(
        conversations,
        eq(messages.idConversation, conversations.idConversation),
      )
      .innerJoin(stages, eq(conversations.idStage, stages.idStage))
      .where(
        and(
          eq(conversations.typeConversation, "superviseur"),
          eq(conversations.idMembreEntreprise, access.idMembre),
          eq(stages.idEntreprise, access.idEntreprise),
          inArray(stages.idStage, stageIds),
          ne(messages.idExpediteur, idUtilisateur),
          eq(messages.statutLecture, "envoye"),
        ),
      );
    return { count: result?.count ?? 0 };
  }

  return { count: 0 };
}
