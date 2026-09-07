// Tickets SSE temporaires, à usage unique, stockés uniquement sous forme de hash.
// Le secret brut n'est jamais persisté ni journalisé.

import crypto from "crypto";
import { and, eq, isNull, gt, lt } from "drizzle-orm";
import { db } from "../../db/index.js";
import { sseTickets, utilisateurs } from "../../db/schema.js";

/** Durée de vie du ticket (30 secondes). */
export const SSE_TICKET_TTL_MS = 30_000;

function hashTicket(rawTicket) {
  return crypto.createHash("sha256").update(rawTicket, "utf8").digest("hex");
}

/**
 * Génère un ticket SSE pour un utilisateur déjà authentifié (requireAuth).
 * @param {string} idUtilisateur
 * @returns {Promise<{ ticket: string, expiresIn: number }>}
 */
export async function createSseTicket(idUtilisateur) {
  if (!idUtilisateur) {
    const err = new Error("Authentification requise");
    err.status = 401;
    throw err;
  }

  const [utilisateur] = await db
    .select({ statutCompte: utilisateurs.statutCompte })
    .from(utilisateurs)
    .where(eq(utilisateurs.idUtilisateur, idUtilisateur));

  if (!utilisateur || utilisateur.statutCompte === "suspendu") {
    const err = new Error("Compte indisponible");
    err.status = 403;
    throw err;
  }

  const rawTicket = crypto.randomBytes(32).toString("base64url");
  const ticketHash = hashTicket(rawTicket);
  const dateExpiration = new Date(Date.now() + SSE_TICKET_TTL_MS);

  await db.insert(sseTickets).values({
    idUtilisateur,
    ticketHash,
    dateExpiration,
  });

  // Nettoyage opportuniste des tickets expirés (best-effort, non bloquant)
  void purgeExpiredTickets().catch(() => {});

  return {
    ticket: rawTicket,
    expiresIn: Math.floor(SSE_TICKET_TTL_MS / 1000),
  };
}

/**
 * Consomme atomiquement un ticket et retourne l'idUtilisateur associé.
 * Refuse ticket invalide, expiré ou déjà utilisé.
 * @param {string} rawTicket
 * @returns {Promise<string>} idUtilisateur
 */
export async function consumeSseTicket(rawTicket) {
  if (!rawTicket || typeof rawTicket !== "string" || rawTicket.length < 16) {
    const err = new Error("Ticket SSE invalide");
    err.status = 401;
    throw err;
  }

  const ticketHash = hashTicket(rawTicket);
  const now = new Date();

  // UPDATE atomique : une seule connexion peut consommer le ticket
  const consumed = await db
    .update(sseTickets)
    .set({ dateUtilisation: now })
    .where(
      and(
        eq(sseTickets.ticketHash, ticketHash),
        isNull(sseTickets.dateUtilisation),
        gt(sseTickets.dateExpiration, now),
      ),
    )
    .returning({
      idUtilisateur: sseTickets.idUtilisateur,
    });

  if (!consumed.length) {
    const err = new Error("Ticket SSE invalide, expiré ou déjà utilisé");
    err.status = 401;
    throw err;
  }

  const idUtilisateur = consumed[0].idUtilisateur;

  const [utilisateur] = await db
    .select({ statutCompte: utilisateurs.statutCompte })
    .from(utilisateurs)
    .where(eq(utilisateurs.idUtilisateur, idUtilisateur));

  if (!utilisateur || utilisateur.statutCompte === "suspendu") {
    const err = new Error("Compte indisponible");
    err.status = 403;
    throw err;
  }

  return idUtilisateur;
}

/** Supprime les tickets expirés (et optionnellement déjà utilisés depuis > 1h). */
export async function purgeExpiredTickets() {
  const now = new Date();
  await db
    .delete(sseTickets)
    .where(lt(sseTickets.dateExpiration, now));
}
