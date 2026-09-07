/**
 * Tests de sécurité SSE ticket (à exécuter avec API + BDD up).
 *
 * Usage:
 *   API_URL=http://localhost:4000 ACCESS_TOKEN=... node script/test-sse-ticket-security.js
 *
 * Vérifie :
 * 1. POST /realtime/ticket authentifié → ticket
 * 2. GET /events?token=JWT → 401
 * 3. GET /events?ticket=abc → 401
 * 4. ticket valide → SSE 200
 * 5. même ticket une 2e fois → 401
 */

const API = process.env.API_URL || "http://localhost:4000";
const TOKEN = process.env.ACCESS_TOKEN;

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exit(1);
  }
  console.log("OK:", msg);
}

async function main() {
  if (!TOKEN) {
    console.error("ACCESS_TOKEN requis");
    process.exit(1);
  }

  // 1. Ticket
  const tRes = await fetch(`${API}/realtime/ticket`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  assert(tRes.status === 200, "POST /ticket → 200");
  const { ticket, expiresIn } = await tRes.json();
  assert(typeof ticket === "string" && ticket.length > 20, "ticket opaque reçu");
  assert(expiresIn <= 60, "TTL ticket ≤ 60s");

  // 2. JWT dans URL interdit
  const jwtUrl = await fetch(
    `${API}/realtime/events?token=${encodeURIComponent(TOKEN)}`,
  );
  assert(jwtUrl.status === 401, "GET ?token=JWT → 401");

  // 3. Ticket invalide
  const bad = await fetch(`${API}/realtime/events?ticket=abc`);
  assert(bad.status === 401, "GET ?ticket=abc → 401");

  // 4. Première utilisation OK (SSE — on lit le status via fetch, pas EventSource)
  const ok = await fetch(
    `${API}/realtime/events?ticket=${encodeURIComponent(ticket)}`,
  );
  // Pour SSE, le status est 200 et content-type event-stream
  assert(ok.status === 200, "GET ?ticket=valide → 200");
  const ct = ok.headers.get("content-type") || "";
  assert(ct.includes("text/event-stream"), "Content-Type event-stream");
  // Fermer le body pour ne pas bloquer
  ok.body?.cancel?.();

  // 5. Replay refusé
  const replay = await fetch(
    `${API}/realtime/events?ticket=${encodeURIComponent(ticket)}`,
  );
  assert(replay.status === 401, "rejeu du même ticket → 401");

  console.log("\nTous les tests de sécurité SSE ticket sont passés.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
