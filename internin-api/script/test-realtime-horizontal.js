/**
 * Test de contrat du bus realtime horizontal.
 *
 * Ce test vérifie la propriété essentielle de l'architecture : plusieurs
 * processus peuvent LISTEN sur le même canal PostgreSQL et un événement émis
 * par l'un est reçu par l'autre.
 *
 * Usage :
 *   node script/test-realtime-horizontal.js
 *
 * Requiert DATABASE_URL et PostgreSQL accessible.
 */
import { Client } from "pg";
import crypto from "node:crypto";

const CHANNEL = process.env.REALTIME_PG_CHANNEL || "internin_realtime_v1";
const TIMEOUT_MS = 5_000;

function quoteIdentifier(identifier) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
    throw new Error("REALTIME_PG_CHANNEL invalide");
  }
  return `"${identifier}"`;
}

const instanceA = `test-a-${crypto.randomUUID()}`;
const instanceB = `test-b-${crypto.randomUUID()}`;
const payload = JSON.stringify({
  idUtilisateur: "00000000-0000-0000-0000-000000000001",
  event: { type: "test.horizontal", payload: { instanceA } },
  origin: instanceA,
});

const a = new Client({ connectionString: process.env.DATABASE_URL });
const b = new Client({ connectionString: process.env.DATABASE_URL });

let timer;
try {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL requis");

  await Promise.all([a.connect(), b.connect()]);
  await Promise.all([
    a.query(`LISTEN ${quoteIdentifier(CHANNEL)}`),
    b.query(`LISTEN ${quoteIdentifier(CHANNEL)}`),
  ]);

  const received = new Promise((resolve, reject) => {
    timer = setTimeout(() => reject(new Error("Timeout LISTEN/NOTIFY")), TIMEOUT_MS);
    b.on("notification", (message) => {
      if (message.channel !== CHANNEL) return;
      try {
        const parsed = JSON.parse(message.payload);
        if (
          parsed?.origin === instanceA &&
          parsed?.event?.type === "test.horizontal"
        ) {
          clearTimeout(timer);
          resolve(parsed);
        }
      } catch {
        // Ignore other notifications.
      }
    });
  });

  await a.query("SELECT pg_notify($1, $2)", [CHANNEL, payload]);
  const message = await received;

  if (message.event.payload.instanceA !== instanceA) {
    throw new Error("Payload realtime altéré");
  }

  console.log("OK: LISTEN/NOTIFY diffuse bien entre deux connexions PostgreSQL.");
} finally {
  if (timer) clearTimeout(timer);
  await Promise.allSettled([a.end(), b.end()]);
}
