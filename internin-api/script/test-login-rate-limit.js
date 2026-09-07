/**
 * Tests rate-limit login (store mémoire).
 * node script/test-login-rate-limit.js
 */
import {
  assertLoginAllowed,
  recordLoginFailure,
  clearLoginAccountLimit,
  _resetLoginRateLimitStores,
  backoffMs,
  LOGIN_RATE_LIMIT_CONFIG,
} from "../src/modules/auth/loginRateLimit.service.js";

const { ACCOUNT_MAX, IP_MAX } = LOGIN_RATE_LIMIT_CONFIG;

let failed = 0;
function assert(name, cond) {
  if (!cond) {
    console.error("FAIL", name);
    failed++;
  } else console.log("OK  ", name);
}

async function expect429(fn) {
  try {
    await fn();
    return false;
  } catch (e) {
    return e?.status === 429 && e?.retryAfter > 0;
  }
}

_resetLoginRateLimitStores();

// Backoff curve
assert("backoff under max = 0", backoffMs(ACCOUNT_MAX - 1) === 0);
assert("backoff at max > 0", backoffMs(ACCOUNT_MAX) > 0);

// Account limit
const email = "victim@example.com";
for (let i = 0; i < ACCOUNT_MAX; i++) {
  recordLoginFailure({ emailNormalise: email, ip: `1.1.1.${i}` });
}
assert(
  "account limited after max failures",
  await expect429(() => assertLoginAllowed({ emailNormalise: email, ip: "9.9.9.9" })),
);

// Success clears account
clearLoginAccountLimit(email);
assert(
  "account cleared after success",
  !(await expect429(() => assertLoginAllowed({ emailNormalise: email, ip: "9.9.9.9" }))),
);

// IP limit
_resetLoginRateLimitStores();
const ip = "203.0.113.10";
for (let i = 0; i < IP_MAX; i++) {
  recordLoginFailure({ emailNormalise: `user${i}@x.com`, ip });
}
assert(
  "IP limited after max",
  await expect429(() => assertLoginAllowed({ emailNormalise: "other@x.com", ip })),
);

// Different IP still ok for new email (account not failed)
assert(
  "other IP allowed",
  !(await expect429(() =>
    assertLoginAllowed({ emailNormalise: "fresh@x.com", ip: "198.51.100.1" }),
  )),
);

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log("\nAll login rate-limit checks passed");
console.log("config", LOGIN_RATE_LIMIT_CONFIG);
