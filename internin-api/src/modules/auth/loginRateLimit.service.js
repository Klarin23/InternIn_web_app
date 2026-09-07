/**
 * Rate limiting login à deux niveaux (IP + email) avec backoff progressif.
 *
 * Sans Redis : store mémoire process-local + filet d'audit DB
 * (tentatives_connexion) pour reconstituer le compteur compte après restart
 * ou entre instances (requête indexée sur fenêtre glissante).
 *
 * Variables d'environnement (optionnelles) :
 *   LOGIN_RATE_LIMIT_IP_MAX=20
 *   LOGIN_RATE_LIMIT_IP_WINDOW_MS=900000
 *   LOGIN_RATE_LIMIT_ACCOUNT_MAX=5
 *   LOGIN_RATE_LIMIT_ACCOUNT_WINDOW_MS=900000
 */

import crypto from "crypto";

const IP_MAX = Number(process.env.LOGIN_RATE_LIMIT_IP_MAX || 20);
const IP_WINDOW_MS = Number(
  process.env.LOGIN_RATE_LIMIT_IP_WINDOW_MS || 15 * 60 * 1000,
);
const ACCOUNT_MAX = Number(process.env.LOGIN_RATE_LIMIT_ACCOUNT_MAX || 5);
const ACCOUNT_WINDOW_MS = Number(
  process.env.LOGIN_RATE_LIMIT_ACCOUNT_WINDOW_MS || 15 * 60 * 1000,
);

/** @type {Map<string, { count: number, windowStart: number, lockUntil: number }>} */
const ipStore = new Map();
/** @type {Map<string, { count: number, windowStart: number, lockUntil: number }>} */
const accountStore = new Map();

const MSG_429 =
  "Trop de tentatives de connexion. Veuillez patienter quelques instants avant de réessayer.";

function hashIdentifiant(emailNormalise) {
  return crypto
    .createHash("sha256")
    .update(`login:email:${emailNormalise}`)
    .digest("hex")
    .slice(0, 32);
}

/**
 * Backoff progressif (ms) selon le nombre d'échecs dans la fenêtre.
 * Configurable indirectement via les seuils ACCOUNT_MAX.
 */
export function backoffMs(failures) {
  if (failures < ACCOUNT_MAX) return 0;
  if (failures < ACCOUNT_MAX + 3) return 30 * 1000; // 30s
  if (failures < ACCOUNT_MAX + 6) return 2 * 60 * 1000; // 2 min
  return Math.min(IP_WINDOW_MS, 15 * 60 * 1000); // jusqu'à 15 min
}

function pruneExpired(store, windowMs, now) {
  for (const [k, v] of store) {
    if (v.lockUntil > now) continue;
    if (now - v.windowStart > windowMs) store.delete(k);
  }
}

function touchBucket(store, key, windowMs, now) {
  let b = store.get(key);
  if (!b || now - b.windowStart > windowMs) {
    b = { count: 0, windowStart: now, lockUntil: 0 };
    store.set(key, b);
  }
  return b;
}

function rateLimitError(retryAfterSec) {
  const err = new Error(MSG_429);
  err.status = 429;
  err.retryAfter = Math.max(1, retryAfterSec);
  return err;
}

/**
 * Vérifie IP + email AVANT comparePassword.
 * @param {{ emailNormalise: string, ip: string|null }} args
 */
export async function assertLoginAllowed({ emailNormalise, ip }) {
  const now = Date.now();

  // —— IP ——
  if (ip) {
    pruneExpired(ipStore, IP_WINDOW_MS, now);
    const ipKey = `ip:${ip}`;
    const bucket = touchBucket(ipStore, ipKey, IP_WINDOW_MS, now);
    if (bucket.lockUntil > now) {
      throw rateLimitError(Math.ceil((bucket.lockUntil - now) / 1000));
    }
    if (bucket.count >= IP_MAX) {
      bucket.lockUntil = now + IP_WINDOW_MS;
      throw rateLimitError(Math.ceil(IP_WINDOW_MS / 1000));
    }
  }

  // —— Compte / email (mémoire + DB) ——
  const accKey = hashIdentifiant(emailNormalise);
  pruneExpired(accountStore, ACCOUNT_WINDOW_MS, now);
  const mem = touchBucket(accountStore, accKey, ACCOUNT_WINDOW_MS, now);

  if (mem.lockUntil > now) {
    throw rateLimitError(Math.ceil((mem.lockUntil - now) / 1000));
  }

  // Filet multi-instance / après restart : compter les échecs DB récents
  let dbCount = 0;
  try {
    const { and, eq, gte, sql } = await import("drizzle-orm");
    const { db } = await import("../../db/index.js");
    const { tentativesConnexion } = await import("../../db/schema.js");
    const since = new Date(now - ACCOUNT_WINDOW_MS);
    const [row] = await db
      .select({ n: sql`count(*)::int` })
      .from(tentativesConnexion)
      .where(
        and(
          eq(tentativesConnexion.email, emailNormalise),
          gte(tentativesConnexion.dateCreation, since),
        ),
      );
    dbCount = Number(row?.n || 0);
  } catch {
    /* DB indisponible ou hors test unitaire → mémoire seule */
  }

  const effective = Math.max(mem.count, dbCount);
  const wait = backoffMs(effective);
  if (wait > 0 && effective >= ACCOUNT_MAX) {
    mem.lockUntil = now + wait;
    mem.count = effective;
    throw rateLimitError(Math.ceil(wait / 1000));
  }

  // Stocker le max pour les prochains incréments
  mem.count = effective;
}

/** Incrémente les compteurs après un échec de login. */
export function recordLoginFailure({ emailNormalise, ip }) {
  const now = Date.now();

  if (ip) {
    const bucket = touchBucket(ipStore, `ip:${ip}`, IP_WINDOW_MS, now);
    bucket.count += 1;
    if (bucket.count >= IP_MAX) {
      bucket.lockUntil = now + IP_WINDOW_MS;
    }
  }

  const accKey = hashIdentifiant(emailNormalise);
  const mem = touchBucket(accountStore, accKey, ACCOUNT_WINDOW_MS, now);
  mem.count += 1;
  const wait = backoffMs(mem.count);
  if (wait > 0) {
    mem.lockUntil = now + wait;
  }
}

/** Réinitialise uniquement le compteur compte après un login réussi. */
export function clearLoginAccountLimit(emailNormalise) {
  accountStore.delete(hashIdentifiant(emailNormalise));
}

/** Exposé pour les tests. */
export function _resetLoginRateLimitStores() {
  ipStore.clear();
  accountStore.clear();
}

export const LOGIN_RATE_LIMIT_CONFIG = {
  IP_MAX,
  IP_WINDOW_MS,
  ACCOUNT_MAX,
  ACCOUNT_WINDOW_MS,
};
