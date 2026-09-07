import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "../src/db/index.js";

const LOCK_KEY = "internin:job:sync-stages-statuts:v1";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function tryLock(holdMs = 0) {
  return db.transaction(async (tx) => {
    const result = await tx.execute(
      sql`SELECT pg_try_advisory_xact_lock(
        hashtextextended(${LOCK_KEY}, 0)
      ) AS acquired`,
    );

    const acquired = Boolean(result?.[0]?.acquired);
    if (acquired && holdMs > 0) await sleep(holdMs);
    return acquired;
  });
}

const first = tryLock(250);
await sleep(40);
const second = tryLock(0);

const [firstAcquired, secondAcquired] = await Promise.all([first, second]);

if (firstAcquired === secondAcquired) {
  throw new Error(
    `Le verrou distribué est incorrect: first=${firstAcquired}, second=${secondAcquired}`,
  );
}

console.log("OK: une seule exécution concurrente peut acquérir le verrou de synchronisation.");
