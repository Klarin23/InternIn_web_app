/**
 * Test de concurrence sur la rotation des refresh tokens.
 *
 * Usage (DATABASE_URL configuré) :
 *   node script/test-refresh-race.js
 *
 * NE LOG PAS les tokens bruts.
 */
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "../src/db/index.js";
import { utilisateurs, sessionsUtilisateur } from "../src/db/schema.js";
import { hashRefreshToken, getRefreshTokenExpiry } from "../src/utils/jwt.js";
import { refreshAccessToken } from "../src/modules/auth/auth.service.js";

async function main() {
  const [user] = await db
    .select()
    .from(utilisateurs)
    .where(eq(utilisateurs.statutCompte, "actif"))
    .limit(1);
  if (!user) throw new Error("Aucun utilisateur actif pour le test");

  const raw = crypto.randomBytes(48).toString("hex");
  const hashed = hashRefreshToken(raw);
  await db.insert(sessionsUtilisateur).values({
    idUtilisateur: user.idUtilisateur,
    jeton: hashed,
    dateExpiration: getRefreshTokenExpiry(),
  });

  const n = 10;
  const results = await Promise.allSettled(
    Array.from({ length: n }, () => refreshAccessToken(raw, { ip: "127.0.0.1" })),
  );
  const ok = results.filter((r) => r.status === "fulfilled").length;
  const ko = results.filter((r) => r.status === "rejected").length;
  console.log(`refresh race: success=${ok} fail=${ko} (attendu success=1 fail=${n - 1})`);
  if (ok !== 1) {
    console.error("ÉCHEC — race condition probable");
    process.exit(1);
  }
  console.log("OK");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
