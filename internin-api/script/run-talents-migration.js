/**
 * Applique la migration Talents (0020) directement via pg.
 * Usage: node script/run-talents-migration.js
 * Nécessite DATABASE_URL dans .env
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.join(__dirname, "../drizzle/0020_talents_propositions.sql");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL manquant dans .env");
  process.exit(1);
}

const sql = fs.readFileSync(sqlPath, "utf8");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

try {
  await client.connect();
  await client.query(sql);
  console.log("Migration 0020 (Talents / propositions_stage) appliquée avec succès.");
} catch (err) {
  console.error("Erreur migration:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
