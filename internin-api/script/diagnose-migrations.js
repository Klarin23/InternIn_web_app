import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

console.log("NODE_ENV =", process.env.NODE_ENV);
console.log(
  "DATABASE_URL =",
  process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":***@")
);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

try {
  await migrate(db, {
    migrationsFolder: "./drizzle",
  });

  console.log("? MIGRATIONS RÉUSSIES");
} catch (err) {
  console.error("? MIGRATION ÉCHOUÉE");
  console.error(err);
  console.error("CAUSE :", err?.cause);
  process.exitCode = 1;
} finally {
  await pool.end();
}
