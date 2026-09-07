/**
 * Test de concurrence : un même token ne doit réussir qu'une seule fois.
 *
 * Usage (API démarrée + DATABASE_URL) :
 *   node script/test-token-race.js
 *
 * Ce script insère un token de test en base puis lance N appels parallèles
 * vers resetPassword / verifyEmail via le service (pas HTTP).
 *
 * NE LOG PAS le token brut.
 */
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "../src/db/index.js";
import {
  utilisateurs,
  verificationsEmail,
} from "../src/db/schema.js";
import { resetPassword, verifyEmail } from "../src/modules/auth/auth.service.js";

function hash(t) {
  return crypto.createHash("sha256").update(t).digest("hex");
}

async function pickUser() {
  const [u] = await db.select().from(utilisateurs).limit(1);
  if (!u) throw new Error("Aucun utilisateur en base pour le test");
  return u;
}

async function insertToken(idUtilisateur, type) {
  const raw = crypto.randomBytes(32).toString("hex");
  const hashed = hash(raw);
  await db.insert(verificationsEmail).values({
    idUtilisateur,
    type,
    codeJeton: hashed,
    statut: "en_attente",
    dateExpiration: new Date(Date.now() + 60 * 60 * 1000),
  });
  return raw;
}

async function runConcurrent(label, fn, n = 10) {
  const results = await Promise.allSettled(
    Array.from({ length: n }, () => fn()),
  );
  const ok = results.filter((r) => r.status === "fulfilled").length;
  const ko = results.filter((r) => r.status === "rejected").length;
  console.log(`[${label}] success=${ok} fail=${ko} (attendu: success=1 fail=${n - 1})`);
  if (ok !== 1) {
    console.error(`[${label}] ÉCHEC — race condition probable`);
    process.exitCode = 1;
  } else {
    console.log(`[${label}] OK`);
  }
}

async function main() {
  const user = await pickUser();

  // Reset password race
  const rawReset = await insertToken(user.idUtilisateur, "reinitialisation_mdp");
  // Mot de passe factice respectant une politique minimale courante
  const pwd = "TestRace1!Aa";
  await runConcurrent(
    "resetPassword x2",
    () => resetPassword(rawReset, pwd),
    2,
  );

  // Nouveau token pour le test x10 (le précédent est consommé)
  const rawReset10 = await insertToken(user.idUtilisateur, "reinitialisation_mdp");
  await runConcurrent(
    "resetPassword x10",
    () => resetPassword(rawReset10, pwd),
    10,
  );

  const rawReset20 = await insertToken(user.idUtilisateur, "reinitialisation_mdp");
  await runConcurrent(
    "resetPassword x20",
    () => resetPassword(rawReset20, pwd),
    20,
  );

  // Réutilisation après succès
  try {
    await resetPassword(rawReset20, pwd);
    console.error("[reuse] ÉCHEC — token réutilisable après succès");
    process.exitCode = 1;
  } catch {
    console.log("[reuse] OK — token refusé après consommation");
  }

  // Email verification race (nouvel utilisateur token)
  const rawVerify = await insertToken(user.idUtilisateur, "verification_email");
  // Remettre emailVerifie à false pour le test si besoin
  await db
    .update(utilisateurs)
    .set({ emailVerifie: false })
    .where(eq(utilisateurs.idUtilisateur, user.idUtilisateur));
  await runConcurrent("verifyEmail", () => verifyEmail(rawVerify), 10);

  process.exit(process.exitCode || 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
