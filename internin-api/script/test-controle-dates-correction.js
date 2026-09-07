/**
 * Tests sécurité — demande correction dates (Centre de contrôle).
 * Usage: API démarrée + token admin
 *   ADMIN_TOKEN=... API_URL=http://localhost:4000 node script/test-controle-dates-correction.js
 */
const API = process.env.API_URL || "http://localhost:4000";
const token = process.env.ADMIN_TOKEN;

async function resolve(body) {
  return fetch(`${API}/admin/controle/anomalies/resolve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

async function main() {
  console.log("=== Correction dates — anti-falsification ===");
  // T5 non auth
  const r0 = await resolve({
    fingerprint: "dates_incoherentes::00000000-0000-4000-8000-000000000001",
    action: "demander_correction",
  });
  console.log("T5 sans token:", r0.status, [401, 403].includes(r0.status) ? "OK" : "check auth");

  if (!token) {
    console.log("Skip tests auth — définir ADMIN_TOKEN");
    return;
  }

  // T2 anomaly absente (UUID random — stage probablement inexistant → 404, ou existant sans incohérence → 409)
  const fake = "dates_incoherentes::00000000-0000-4000-8000-000000000099";
  const r2 = await resolve({ fingerprint: fake, action: "demander_correction" });
  const b2 = await r2.json().catch(() => ({}));
  console.log("T2/T4 fingerprint fabriqué:", r2.status, b2.error || b2.code || "", [404, 409, 400].includes(r2.status) ? "OK" : "ATTENTION");

  // Fingerprint mal formé
  const rBad = await resolve({
    fingerprint: "dates_incoherentes::not-a-uuid",
    action: "demander_correction",
  });
  console.log("Fingerprint invalide:", rBad.status, rBad.status === 400 ? "OK" : "ATTENTION");

  console.log("T1 (vraie anomalie) : à valider manuellement avec un stage fin < début.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
