/**
 * Tests manuels versionJeton (API + BDD requis).
 *
 * Usage:
 *   API_URL=http://localhost:4000 \
 *   ACCESS_TOKEN="<jwt_avant_revocation>" \
 *   node script/test-token-version.js
 *
 * Scénario recommandé :
 * 1. Se connecter → noter le JWT
 * 2. Admin suspend le compte OU reset password OU change permissions
 * 3. Relancer ce script avec l'ancien JWT → doit obtenir 401 TOKEN_REVOKED
 */

const API = process.env.API_URL || "http://localhost:4000";
const TOKEN = process.env.ACCESS_TOKEN;

async function main() {
  if (!TOKEN) {
    console.error("ACCESS_TOKEN requis");
    process.exit(1);
  }

  const res = await fetch(`${API}/auth/me`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  }).catch(async () => {
    // fallback route
    return fetch(`${API}/stagiaires/me`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
  });

  console.log("status:", res.status);
  const body = await res.json().catch(() => ({}));
  console.log("body:", body);

  if (res.status === 401) {
    console.log("OK — ancien JWT rejeté (révocation effective)");
    process.exit(0);
  }
  if (res.status === 200) {
    console.log("INFO — JWT encore accepté (pas encore révoqué ou version à jour)");
    process.exit(0);
  }
  process.exit(1);
}

main();
