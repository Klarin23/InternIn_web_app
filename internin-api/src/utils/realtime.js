import crypto from "node:crypto";
import { Client } from "pg";
import { pool } from "../db/index.js";

// Bus temps réel SSE partagé entre toutes les instances API.
//
// Architecture :
//   instance A -> PostgreSQL NOTIFY -> instances A/B/C -> connexions SSE locales
//
// La Map reste locale : elle contient uniquement les connexions HTTP ouvertes
// sur cette instance. LISTEN/NOTIFY fournit le fan-out inter-instances et le
// déploiement n'a donc pas besoin de sticky-session.
//
// LISTEN/NOTIFY n'est pas durable. Les événements métier restent donc
// persistés en BDD et le frontend refetch à l'ouverture/reconnexion SSE.

const REALTIME_CHANNEL =
  process.env.REALTIME_PG_CHANNEL || "internin_realtime_v1";
const INSTANCE_ID =
  process.env.REALTIME_INSTANCE_ID?.trim() ||
  `${process.pid}-${crypto.randomUUID()}`;
const MAX_NOTIFY_PAYLOAD_BYTES = 7_500;
const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;

/** @type {Map<string, Set<import('express').Response>>} */
const clientsByUser = new Map();

let listenerClient = null;
let listenerStarting = null;
let stopped = false;
let reconnectTimer = null;
let reconnectAttempt = 0;

function quoteIdentifier(identifier) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
    throw new Error("REALTIME_PG_CHANNEL invalide");
  }
  return `"${identifier}"`;
}

function serializeSseEvent(event) {
  return JSON.stringify({
    type: event.type,
    payload: event.payload ?? {},
    at: new Date().toISOString(),
  });
}

function deliverLocal(idUtilisateur, event) {
  if (!idUtilisateur || !event?.type) return;
  const set = clientsByUser.get(String(idUtilisateur));
  if (!set || set.size === 0) return;

  const data = serializeSseEvent(event);
  for (const res of set) {
    try {
      res.write(`event: ${event.type}\n`);
      res.write(`data: ${data}\n\n`);
    } catch {
      // La fermeture HTTP déclenche normalement le cleanup.
    }
  }
}

function scheduleListenerReconnect() {
  if (stopped || reconnectTimer || listenerStarting) return;

  const delay = Math.min(
    RECONNECT_BASE_MS * Math.pow(1.5, reconnectAttempt),
    RECONNECT_MAX_MS,
  );
  reconnectAttempt += 1;

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    void startRealtimeListener().catch(() => {});
  }, delay);
}

function handleListenerFailure(client, err) {
  if (listenerClient === client) listenerClient = null;

  console.error(
    "[realtime] listener PostgreSQL error:",
    err?.message || err,
  );

  // Force la fermeture afin que la prochaine tentative utilise une nouvelle
  // connexion et ne conserve pas un client PostgreSQL dégradé.
  void client.end().catch(() => {}).finally(scheduleListenerReconnect);
}

function attachListenerHandlers(client) {
  client.on("notification", (message) => {
    if (message.channel !== REALTIME_CHANNEL || !message.payload) return;

    let parsed;
    try {
      parsed = JSON.parse(message.payload);
    } catch {
      console.error("[realtime] payload PostgreSQL NOTIFY invalide");
      return;
    }

    if (
      !parsed?.idUtilisateur ||
      !parsed?.event?.type ||
      parsed.origin === INSTANCE_ID
    ) {
      return;
    }

    // La connexion SSE peut être hébergée par une autre instance :
    // le NOTIFY arrive ici puis est livré aux sockets locales.
    deliverLocal(parsed.idUtilisateur, parsed.event);
  });

  client.on("error", (err) => handleListenerFailure(client, err));

  client.on("end", () => {
    if (listenerClient === client) listenerClient = null;
    scheduleListenerReconnect();
  });
}

/**
 * Initialise le LISTEN PostgreSQL de l'instance.
 * À appeler une seule fois au démarrage du serveur.
 */
export async function startRealtimeListener() {
  if (stopped) return;
  if (listenerClient) return;
  if (listenerStarting) return listenerStarting;

  listenerStarting = (async () => {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      application_name: `internin-realtime-${INSTANCE_ID}`,
    });

    attachListenerHandlers(client);

    try {
      await client.connect();
      await client.query(`LISTEN ${quoteIdentifier(REALTIME_CHANNEL)}`);
      listenerClient = client;
      reconnectAttempt = 0;
      console.log(`[realtime] LISTEN actif sur ${REALTIME_CHANNEL}`);
    } catch (err) {
      try {
        await client.end();
      } catch {
        /* ignore */
      }
      throw err;
    }
  })();

  let failed = false;
  try {
    await listenerStarting;
  } catch (err) {
    failed = true;
    console.error(
      "[realtime] impossible d'initialiser LISTEN:",
      err?.message || err,
    );
    throw err;
  } finally {
    listenerStarting = null;
    // Le verrou listenerStarting doit être libéré AVANT de planifier la
    // reconnexion, sinon scheduleListenerReconnect() s'auto-bloque.
    if (failed) scheduleListenerReconnect();
  }
}

async function publishDistributed(idUtilisateur, event) {
  const payload = JSON.stringify({
    idUtilisateur: String(idUtilisateur),
    event: {
      type: event.type,
      payload: event.payload ?? {},
    },
    origin: INSTANCE_ID,
  });
  const size = Buffer.byteLength(payload, "utf8");

  // PostgreSQL impose une taille maximale au payload NOTIFY. Ne jamais
  // tronquer un événement métier : un événement incomplet serait pire qu'une
  // absence de push, puisque l'état canonique reste la BDD.
  if (size > MAX_NOTIFY_PAYLOAD_BYTES) {
    throw new Error(
      `Événement realtime trop volumineux (${size} octets > ${MAX_NOTIFY_PAYLOAD_BYTES})`,
    );
  }

  // pg_notify() passe par une connexion du pool et fonctionne quel que soit
  // le serveur API qui émet l'événement. Toutes les instances LISTEN sur le
  // même canal PostgreSQL reçoivent alors le message.
  await pool.query("SELECT pg_notify($1, $2)", [REALTIME_CHANNEL, payload]);
}

/**
 * Enregistre une connexion SSE pour un utilisateur.
 * @param {string} idUtilisateur
 * @param {import('express').Response} res
 */
export function subscribeRealtime(idUtilisateur, res) {
  if (!idUtilisateur || !res) return;
  const key = String(idUtilisateur);
  let set = clientsByUser.get(key);
  if (!set) {
    set = new Set();
    clientsByUser.set(key, set);
  }
  set.add(res);

  const cleanup = () => {
    set.delete(res);
    if (set.size === 0) clientsByUser.delete(key);
  };
  res.on("close", cleanup);
  res.on("error", cleanup);
}

/**
 * Publie un événement vers toutes les connexions de l'utilisateur.
 * Livraison locale immédiate + fan-out PostgreSQL vers les autres instances.
 */
export function publishRealtime(idUtilisateur, event) {
  if (!idUtilisateur || !event?.type) return;

  // Latence minimale pour les clients connectés à cette instance.
  deliverLocal(idUtilisateur, event);

  // L'instance émettrice ignore son propre NOTIFY grâce à INSTANCE_ID ; les
  // autres instances le relaient vers leurs connexions SSE locales.
  void publishDistributed(idUtilisateur, event).catch((err) => {
    console.error(
      "[realtime] publication inter-instance échouée:",
      err?.message || err,
    );
  });
}

/**
 * Publie le même événement à plusieurs utilisateurs.
 * @param {string[]} ids
 * @param {{ type: string, payload?: object }} event
 */
export function publishRealtimeMany(ids, event) {
  if (!Array.isArray(ids) || !event) return;
  for (const id of ids) publishRealtime(id, event);
}

/** Nombre de connexions locales (debug / monitoring). */
export function realtimeStats() {
  let connections = 0;
  for (const set of clientsByUser.values()) connections += set.size;
  return {
    users: clientsByUser.size,
    connections,
    instanceId: INSTANCE_ID,
    channel: REALTIME_CHANNEL,
    distributed: true,
    listenerConnected: !!listenerClient,
  };
}

/** Arrêt propre du listener PostgreSQL. */
export async function stopRealtimeListener() {
  stopped = true;

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  const client = listenerClient;
  listenerClient = null;

  if (client) {
    try {
      await client.end();
    } catch {
      /* ignore */
    }
  }
}
