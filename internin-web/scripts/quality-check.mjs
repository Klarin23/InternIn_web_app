#!/usr/bin/env node
/**
 * INTERNIN QUALITY CHECK
 * Orchestration locale des contrôles pré-déploiement.
 * Usage (depuis internin-web) : node scripts/quality-check.mjs
 * ou : npm run quality
 *
 * Codes de sortie : 0 = READY, 1 = FAIL
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const apiRoot = path.resolve(root, "../internin-api");

const results = {
  eslint: { errors: null, criticalWarnings: null, ok: false },
  unit: { passed: null, ok: false },
  e2e: {
    Authentication: null,
    Propositions: null,
    Acceptation: null,
    Candidature: null,
  },
  build: { ok: false },
  api: { server: null, database: null, routes: null },
};

function run(cmd, args, cwd = root, env = {}) {
  const r = spawnSync(cmd, args, {
    cwd,
    encoding: "utf8",
    shell: process.platform === "win32",
    env: { ...process.env, ...env },
  });
  return {
    code: r.status ?? 1,
    stdout: r.stdout || "",
    stderr: r.stderr || "",
  };
}

console.log("INTERNIN QUALITY CHECK");
console.log("────────────────────────────────");

// ── ESLint ──────────────────────────────────────────────
{
  const r = run("npx", ["eslint", ".", "--max-warnings=0"]);
  results.eslint.ok = r.code === 0;
  results.eslint.errors = r.code === 0 ? 0 : "fail";
  results.eslint.criticalWarnings = r.code === 0 ? 0 : "fail";
  console.log("ESLint");
  console.log(
    results.eslint.ok ? "✓ 0 errors" : "✗ ESLint failed (see npm run lint)",
  );
  console.log(
    results.eslint.ok
      ? "✓ 0 critical warnings"
      : "✗ critical warnings or errors present",
  );
}

// ── Unit / Integration ──────────────────────────────────
{
  const r = run("npx", ["vitest", "run", "--reporter=default"]);
  const m = r.stdout.match(/(\d+)\s+passed/);
  results.unit.passed = m ? Number(m[1]) : r.code === 0 ? 0 : null;
  results.unit.ok = r.code === 0;
  console.log("Unit / Integration Tests");
  if (results.unit.ok) {
    console.log(`✓ ${results.unit.passed ?? "?"} passed`);
  } else {
    console.log("✗ unit tests failed (npm run test)");
  }
}

// ── E2E ─────────────────────────────────────────────────
{
  console.log("E2E");
  const suites = ["auth", "propositions", "acceptation", "candidature"];
  const labels = {
    auth: "Authentication",
    propositions: "Propositions",
    acceptation: "Acceptation",
    candidature: "Candidature",
  };
  for (const s of suites) {
    const r = run("npx", ["playwright", "test", `e2e/${s}.spec.js`]);
    const ok = r.code === 0;
    results.e2e[labels[s]] = ok;
    console.log(ok ? `✓ ${labels[s]}` : `✗ ${labels[s]}`);
  }
}

// ── Build ───────────────────────────────────────────────
{
  const r = run("npx", ["next", "build"], root, {
    // évite de re-polluer la console trop long si déjà buildé
  });
  results.build.ok = r.code === 0;
  console.log("Build");
  console.log(results.build.ok ? "✓ Next.js production build" : "✗ build failed");
}

// ── API ─────────────────────────────────────────────────
{
  console.log("API");
  const health = process.env.API_HEALTH_URL || "http://localhost:4000/health";
  try {
    const res = await fetch(health, { signal: AbortSignal.timeout(5000) });
    results.api.server = res.ok || res.status < 500;
    // Si /health n'existe pas encore, 404 = serveur up quand même
    if (res.status === 404) results.api.server = true;
    console.log(results.api.server ? "✓ Server starts" : "✗ Server not reachable");
  } catch {
    results.api.server = false;
    console.log("✗ Server starts (API injoignable — lance l'API)");
  }

  // DB : endpoint optionnel ou script api
  try {
    const res = await fetch(
      process.env.API_READY_URL || "http://localhost:4000/health/ready",
      { signal: AbortSignal.timeout(5000) },
    );
    results.api.database = res.ok;
    console.log(results.api.database ? "✓ Database connection" : "✗ Database connection");
  } catch {
    results.api.database = false;
    console.log("✗ Database connection (ou route /health/ready absente)");
  }

  try {
    const res = await fetch(
      process.env.API_CRITICAL_URL || "http://localhost:4000/referentiels/pays",
      { signal: AbortSignal.timeout(5000) },
    );
    results.api.routes = res.status < 500;
    console.log(results.api.routes ? "✓ Critical routes" : "✗ Critical routes");
  } catch {
    results.api.routes = false;
    console.log("✗ Critical routes");
  }
}

console.log("────────────────────────────────");

const e2eOk = Object.values(results.e2e).every(Boolean);
const ready =
  results.eslint.ok &&
  results.unit.ok &&
  e2eOk &&
  results.build.ok &&
  results.api.server &&
  results.api.database &&
  results.api.routes;

console.log(ready ? "STATUS: READY" : "STATUS: NOT READY");
process.exit(ready ? 0 : 1);
