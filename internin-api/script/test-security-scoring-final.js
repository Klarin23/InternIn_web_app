/**
 * Finalisation scoring — non-régression + multi-comptes sessions
 * node script/test-security-scoring-final.js
 */
import {
  scoreRegulariteIntervalles,
  detectIncompatibleTravel,
  countRapidIpSwitches,
  computeBehavioralScores,
} from "../src/modules/administrateurs/securityScoring.js";

const T = {
  multiSessionsActives: 3,
  multiIp7j: 3,
  sessionsRapides24h: 5,
  echecsLogin1h: 5,
  echecsLogin24h: 10,
  autoTentativesFenetreMin: 15,
  scoreAttention: 30,
  scoreCritique: 60,
};

let failed = 0;
function assert(name, cond) {
  if (!cond) {
    console.error("FAIL", name);
    failed++;
  } else console.log("OK  ", name);
}

const base = Date.now();
const emptyAgg = {
  sessionsActives: 0,
  ipsActives: new Set(),
  ips7j: new Set(),
  lieux: new Set(),
  connexions: [],
  sessions24h: 0,
  echecs1h: 0,
  echecs24h: 0,
  echecsFenetreCourte: 0,
  regulariteScore: 0,
};

// 1 — IP normale
const t1 = computeBehavioralScores(
  { ...emptyAgg, sessionsActives: 1, ipsActives: new Set(["1.1.1.1"]), ips7j: new Set(["1.1.1.1"]), sessions24h: 1 },
  { statutCompte: "actif", emailVerifie: true },
  T,
  { multiAccountsSameIp: 1, successfulAccountsByIp: 1, failedAccountsByIp: 0, failedAttemptsByIp: 0 },
);
assert("1 normal", t1.niveau === "normal" || t1.scoreGlobal < 20);

// 2 — réseau partagé légitime (20 comptes, peu d'échecs, pas dense)
const t2 = computeBehavioralScores(
  { ...emptyAgg, sessionsActives: 1, ips7j: new Set(["10.0.0.1"]) },
  { statutCompte: "actif", emailVerifie: true },
  T,
  {
    multiAccountsSameIp: 20,
    successfulAccountsByIp: 20,
    failedAccountsByIp: 1,
    failedAttemptsByIp: 2,
    rapidSessionsByIp: 2,
  },
);
assert("2 shared wifi no attack", t2.niveau !== "attaque_probable");
assert("2 shared wifi auto low/medium", t2.scoreAutomatisation < 40);

// 3 — multi-comptes suspect (dense)
const t3 = computeBehavioralScores(
  { ...emptyAgg, echecs1h: 5, echecs24h: 40, echecsFenetreCourte: 20 },
  { statutCompte: "actif", emailVerifie: true },
  T,
  {
    multiAccountsSameIp: 20,
    successfulAccountsByIp: 8,
    failedAccountsByIp: 15,
    failedAttemptsByIp: 40,
    rapidSessionsByIp: 12,
  },
);
assert("3 dense multi signal", t3.signaux.some((s) => s.code === "multi_accounts_same_ip"));
assert("3 auto élevé", t3.scoreAutomatisation >= 45);
assert("3 not partage", t3.niveau !== "partage_probable");

// 4 — sessions réussies multi-comptes (signal si dense via rapid+volume)
const t4 = computeBehavioralScores(
  { ...emptyAgg },
  { statutCompte: "actif", emailVerifie: true },
  T,
  {
    multiAccountsSameIp: 15,
    successfulAccountsByIp: 15,
    failedAccountsByIp: 0,
    failedAttemptsByIp: 0,
    rapidSessionsByIp: 10,
  },
);
assert("4 success multi dense", t4.signaux.some((s) => s.code === "multi_accounts_same_ip"));

// 5 — brute-force même compte
const t5 = computeBehavioralScores(
  {
    ...emptyAgg,
    sessionsActives: 1,
    ips7j: new Set(["9.9.9.9"]),
    echecs1h: 40,
    echecs24h: 50,
    echecsFenetreCourte: 40,
  },
  { statutCompte: "actif", emailVerifie: true },
  T,
);
assert("5 brute auto", t5.scoreAutomatisation >= 50);
assert("5 not partage", t5.scorePartageCompte < 25);

// 6 — partage
const t6 = computeBehavioralScores(
  {
    sessionsActives: 5,
    ipsActives: new Set(["1", "2", "3", "4"]),
    ips7j: new Set(["1", "2", "3", "4"]),
    lieux: new Set(["a", "b", "c"]),
    connexions: [
      { dateConnexion: new Date(base - 18 * 60e3).toISOString(), adresseIp: "1", villeConnexion: "Douala", paysConnexion: "CM" },
      { dateConnexion: new Date(base - 10 * 60e3).toISOString(), adresseIp: "2", villeConnexion: "Paris", paysConnexion: "FR" },
      { dateConnexion: new Date(base - 4 * 60e3).toISOString(), adresseIp: "3", villeConnexion: "Lagos", paysConnexion: "NG" },
    ],
    sessions24h: 6,
    echecs1h: 0,
    echecs24h: 0,
    echecsFenetreCourte: 0,
    regulariteScore: 0,
  },
  { statutCompte: "actif", emailVerifie: true },
  T,
);
assert("6 partage score", t6.scorePartageCompte >= 45);
assert("6 auto bas", t6.scoreAutomatisation < 30);

// 7 — mobilité légitime
const t7 = detectIncompatibleTravel([
  { dateConnexion: new Date(base - 5 * 3600e3).toISOString(), ville: "Douala", pays: "CM" },
  { dateConnexion: new Date(base - 1 * 3600e3).toISOString(), ville: "Yaoundé", pays: "CM" },
]);
assert("7 mobilité ok (pas fort)", !t7.some((s) => s.strength === "fort"));

// 8 — impossible travel
const t8 = detectIncompatibleTravel([
  { dateConnexion: new Date(base - 8 * 60e3).toISOString(), villeConnexion: "Douala", paysConnexion: "CM" },
  { dateConnexion: new Date(base - 2 * 60e3).toISOString(), villeConnexion: "Paris", paysConnexion: "FR" },
]);
assert("8 travel fort", t8.some((s) => s.strength === "fort"));

// 9 — données manquantes
const t9 = computeBehavioralScores(
  { ...emptyAgg, connexions: [{ dateConnexion: null, adresseIp: null }] },
  { statutCompte: "actif", emailVerifie: true },
  T,
  {},
);
assert("9 no throw", t9.scoreGlobal >= 0);

// 10 — cap
assert("10 cap", t3.scoreGlobal <= 100 && t6.scoreGlobal <= 100);

// Non-régression: email non vérifié hors partage
const tEmail = computeBehavioralScores(
  { ...emptyAgg, sessionsActives: 1, ips7j: new Set(["1"]) },
  { statutCompte: "actif", emailVerifie: false },
  T,
);
assert("NR email not partage", tEmail.scorePartageCompte === 0);
assert("NR email auth", tEmail.scoreAuthentification > 0);

if (failed) {
  console.error(failed, "failures");
  process.exit(1);
}
console.log("\nAll final security scoring tests passed (" + (10 + 2) + " scenarios)");
