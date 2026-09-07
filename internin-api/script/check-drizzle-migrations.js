#!/usr/bin/env node
/**
 * Vérifie la cohérence des migrations Drizzle :
 *  - aucun préfixe numérique dupliqué dans drizzle/*.sql
 *  - chaque entrée du journal a un fichier SQL correspondant
 *  - chaque fichier SQL actif (hors archive) est dans le journal
 *  - tags uniques dans le journal
 *  - idx séquentiels 0..n-1
 *
 * Exit 0 si OK, 1 sinon.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const drizzleDir = path.join(root, "drizzle");
const metaDir = path.join(drizzleDir, "meta");
const journalPath = path.join(metaDir, "_journal.json");

const errors = [];
const warnings = [];

function fail(msg) {
  errors.push(msg);
}
function warn(msg) {
  warnings.push(msg);
}

if (!fs.existsSync(drizzleDir)) {
  console.error("drizzle/ introuvable");
  process.exit(1);
}
if (!fs.existsSync(journalPath)) {
  console.error("drizzle/meta/_journal.json introuvable");
  process.exit(1);
}

const journal = JSON.parse(fs.readFileSync(journalPath, "utf8"));
const sqlFiles = fs
  .readdirSync(drizzleDir)
  .filter((f) => f.endsWith(".sql") && fs.statSync(path.join(drizzleDir, f)).isFile());

// 1. Préfixes numériques uniques
const byPrefix = new Map();
for (const f of sqlFiles) {
  const m = /^(\d{4})_/.exec(f);
  if (!m) {
    fail(`Nom de migration non conforme (attendu NNNN_tag.sql) : ${f}`);
    continue;
  }
  const prefix = m[1];
  if (!byPrefix.has(prefix)) byPrefix.set(prefix, []);
  byPrefix.get(prefix).push(f);
}
for (const [prefix, files] of [...byPrefix.entries()].sort()) {
  if (files.length > 1) {
    fail(`Préfixe dupliqué ${prefix} : ${files.join(", ")}`);
  }
}

// 2. Tags uniques dans le journal
const tags = journal.entries.map((e) => e.tag);
const tagSet = new Set();
for (const tag of tags) {
  if (tagSet.has(tag)) fail(`Tag journal dupliqué : ${tag}`);
  tagSet.add(tag);
}

// 3. idx séquentiels
journal.entries.forEach((e, i) => {
  if (e.idx !== i) {
    fail(`idx journal incohérent à la position ${i} : trouvé idx=${e.idx}`);
  }
});

// 4. Chaque entrée journal → fichier SQL
for (const e of journal.entries) {
  const expected = `${e.tag}.sql`;
  if (!sqlFiles.includes(expected)) {
    fail(`Journal référence ${e.tag} mais ${expected} est absent de drizzle/`);
  }
}

// 5. Chaque SQL actif → journal
for (const f of sqlFiles) {
  const tag = f.replace(/\.sql$/, "");
  if (!tagSet.has(tag)) {
    fail(`Fichier SQL orphelin (absent du journal) : ${f}`);
  }
}

// 6. Snapshots : avertir si manquants
for (const e of journal.entries) {
  const snap = path.join(metaDir, `${String(e.idx).padStart(4, "0")}_snapshot.json`);
  if (!fs.existsSync(snap)) {
    warn(`Snapshot manquant pour idx=${e.idx} tag=${e.tag} (${path.basename(snap)})`);
  }
}

// 7. Archive orphelins
const orphanDir = path.join(drizzleDir, "_orphans_archive");
if (fs.existsSync(orphanDir)) {
  const orphans = fs.readdirSync(orphanDir).filter((f) => f.endsWith(".sql"));
  console.log(`Archive orphelins : ${orphans.length} fichier(s) dans drizzle/_orphans_archive/`);
}

if (warnings.length) {
  console.log("\nAvertissements :");
  warnings.forEach((w) => console.log(`  ⚠ ${w}`));
}

if (errors.length) {
  console.error("\nErreurs :");
  errors.forEach((e) => console.error(`  ✖ ${e}`));
  console.error(`\n${errors.length} erreur(s) — migrations INCOHÉRENTES`);
  process.exit(1);
}

console.log(`\nOK — ${sqlFiles.length} migrations, ${journal.entries.length} entrées journal, aucun doublon.`);
process.exit(0);
