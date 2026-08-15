import { eq, and, desc, ne, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  conversations,
  messages,
  stages,
  stagiaires,
  entreprises,
  utilisateurs,
} from "../../db/schema.js";

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
 * Vérifie si le stage autorise l'envoi de messages.
 * Règle métier : uniquement statut "actif".
 */
function canSendMessages(statutStage) {
  return statutStage === "actif";
}

function canReadMessages(statutStage) {
  // Historique lisible même après fin de stage
  return statutStage === "actif" || statutStage === "termine" || statutStage === "interrompu";
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
    const entreprise = await resolveEntreprise(idUtilisateur);
    if (!entreprise || entreprise.idEntreprise !== row.idEntreprise) {
      throw forbidden("Vous n'êtes pas autorisé à accéder à cette conversation");
    }
  } else {
    throw forbidden("Rôle non autorisé pour la messagerie");
  }

  if (!canReadMessages(row.statutStage)) {
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
      statut: conversations.statut,
      dateCreation: conversations.dateCreation,
      idStage: stages.idStage,
      statutStage: stages.statut,
      dateDebut: stages.dateDebut,
      dateFinPrevue: stages.dateFinPrevue,
      nomEntreprise: entreprises.nomEntreprise,
      logoUrl: entreprises.logoUrl,
      secteurActivite: entreprises.secteurActivite,
    })
    .from(conversations)
    .innerJoin(stages, eq(conversations.idStage, stages.idStage))
    .innerJoin(entreprises, eq(stages.idEntreprise, entreprises.idEntreprise))
    .where(eq(stages.idStagiaire, stagiaire.idStagiaire))
    .orderBy(desc(conversations.dateCreation));

  return enrichConversations(rows, idUtilisateur);
}

// ---------------------------------------------------------------------------
// Liste conversations — Entreprise
// ---------------------------------------------------------------------------

export async function listConversationsEntreprise(idUtilisateur) {
  const entreprise = await resolveEntreprise(idUtilisateur);
  if (!entreprise) return [];

  // Conversations existantes liées aux stages de l'entreprise
  const rows = await db
    .select({
      idConversation: conversations.idConversation,
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
    .where(eq(stages.idEntreprise, entreprise.idEntreprise))
    .orderBy(desc(conversations.dateCreation));

  // Stages actifs sans conversation encore créée → on peut créer la conversation
  // uniquement si le stage est actif (règle métier).
  const stagesActifs = await db
    .select({
      idStage: stages.idStage,
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
        eq(stages.idEntreprise, entreprise.idEntreprise),
        eq(stages.statut, "actif"),
      ),
    );

  const existingStageIds = new Set(rows.map((r) => r.idStage));
  const toCreate = stagesActifs.filter((s) => !existingStageIds.has(s.idStage));

  for (const s of toCreate) {
    const [created] = await db
      .insert(conversations)
      .values({ idStage: s.idStage, statut: "active" })
      .returning();
    if (created) {
      rows.push({
        idConversation: created.idConversation,
        statut: created.statut,
        dateCreation: created.dateCreation,
        idStage: s.idStage,
        statutStage: s.statutStage,
        dateDebut: s.dateDebut,
        dateFinPrevue: s.dateFinPrevue,
        prenom: s.prenom,
        nom: s.nom,
        photoProfilUrl: s.photoProfilUrl,
        idUtilisateurStagiaire: s.idUtilisateurStagiaire,
      });
    }
  }

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
        dernierMessage: lastMsg || null,
        nonLus: unread?.count ?? 0,
        messagerieActive: canSendMessages(row.statutStage),
        lectureSeule: !canSendMessages(row.statutStage) && canReadMessages(row.statutStage),
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

export async function listConversations(idUtilisateur, typeUtilisateur) {
  if (typeUtilisateur === "stagiaire") {
    return listConversationsStagiaire(idUtilisateur);
  }
  if (typeUtilisateur === "entreprise") {
    return listConversationsEntreprise(idUtilisateur);
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

  if (!canSendMessages(ctx.statutStage)) {
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
          eq(stages.idEntreprise, entreprise.idEntreprise),
          ne(messages.idExpediteur, idUtilisateur),
          eq(messages.statutLecture, "envoye"),
        ),
      );
    return { count: result?.count ?? 0 };
  }

  return { count: 0 };
}
