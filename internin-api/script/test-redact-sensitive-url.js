/**
 * Tests de redaction des tokens dans les URL / textes de logs.
 * node --test or: node script/test-redact-sensitive-url.js
 */
import { redactSensitiveUrl, redactSensitiveText, REDACTED } from "../src/utils/redactUrl.js";

const SECRET = "TEST_SECRET_TOKEN_DO_NOT_LOG_123456";
let failed = 0;
function a(name, cond) {
  if (!cond) {
    console.error("FAIL", name);
    failed++;
  } else {
    console.log("OK  ", name);
  }
}

// Query tokens
const u1 = `/auth/verifier-email?token=${SECRET}`;
const r1 = redactSensitiveUrl(u1);
a("verifier-email no secret", !r1.includes(SECRET));
a("verifier-email redacted", r1.includes(REDACTED));
a("verifier-email keeps path", r1.startsWith("/auth/verifier-email"));

const u2 = `/reinitialiser-mot-de-passe?token=${SECRET}&lang=fr`;
const r2 = redactSensitiveUrl(u2);
a("reset no secret", !r2.includes(SECRET));
a("reset keeps other params", r2.includes("lang=fr"));

for (const key of ["access_token", "refresh_token", "reset_token", "verification_token", "invite_token", "invitation_token"]) {
  const u = `/x?${key}=${SECRET}`;
  const r = redactSensitiveUrl(u);
  a(`${key} redacted`, !r.includes(SECRET) && r.includes(REDACTED));
}

// Path invitation
const u3 = `/equipe/invitations/${SECRET}`;
const r3 = redactSensitiveUrl(u3);
a("invitation path no secret", !r3.includes(SECRET));
a("invitation path redacted", r3.includes(`/equipe/invitations/${REDACTED}`));

const u4 = `/equipe/invitations/${SECRET}/accepter`;
const r4 = redactSensitiveUrl(u4);
a("invitation accepter no secret", !r4.includes(SECRET));
a("invitation accepter keeps suffix", r4.endsWith("/accepter"));

// Text body
const body = `Cliquez ici : https://app.example/verification-email?token=${SECRET}`;
const rb = redactSensitiveText(body);
a("text body no secret", !rb.includes(SECRET));
a("text body redacted", rb.includes(REDACTED));

// originalUrl style combined log line simulation
const logLine = `GET ${redactSensitiveUrl(`/auth/verifier-email?token=${SECRET}`)} 200`;
a("log line safe", !logLine.includes(SECRET));

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log("\nAll redactSensitiveUrl tests passed");
