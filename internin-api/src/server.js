import "dotenv/config";
import app from "./app.js";
import { startRealtimeListener, stopRealtimeListener } from "./utils/realtime.js";
import { syncStagesStatuts } from "../script/sync-stages-statuts.js";

// ============================================================
// Vérification stricte de l'environnement
// ============================================================

const nodeEnv = process.env.NODE_ENV;

const allowedEnvironments = ["development", "test", "production"];

if (!allowedEnvironments.includes(nodeEnv)) {
  console.error(` NODE_ENV invalide : "${nodeEnv}".`);
  console.error(`Valeurs autorisées : ${allowedEnvironments.join(", ")}`);
  process.exit(1);
}

// ============================================================
// Variables d'environnement critiques
// ============================================================

const requiredEnv = ["JWT_SECRET", "DATABASE_URL"];

const missing = requiredEnv.filter((key) => !process.env[key]?.trim());

if (missing.length > 0) {
  console.error(
    ` Variables d'environnement manquantes : ${missing.join(", ")}`,
  );
  console.error("L'API ne peut pas démarrer sans ces variables.");
  process.exit(1);
}

// ============================================================
// Vérification JWT
// ============================================================

if (process.env.JWT_SECRET.length < 32) {
  console.error(
    " JWT_SECRET trop court. Minimum recommandé : 32 caractères.",
  );
  process.exit(1);
}

// ============================================================
// Vérification environnement ↔ base de données
// ============================================================

let databaseName;

try {
  databaseName = new URL(process.env.DATABASE_URL).pathname.replace(/^\/+/, "");
} catch {
  console.error(" DATABASE_URL est invalide.");
  process.exit(1);
}

const expectedDatabase = {
  development: "internin_dev",
  test: "internin_test",
  production: "internin",
}[nodeEnv];

if (databaseName !== expectedDatabase) {
  console.error(
    ` SÉCURITÉ : NODE_ENV=${nodeEnv} mais DATABASE_URL pointe vers "${databaseName}".`,
  );
  console.error(`Base attendue : "${expectedDatabase}".`);
  process.exit(1);
}

// ============================================================
// Démarrage
// ============================================================

const PORT = Number(process.env.PORT) || 4000;

// En développement uniquement, on garde le confort du comportement historique :
// `npm run dev` lance aussi la synchronisation temporelle des stages.
// En production, ce job reste entièrement externe (`npm run job:sync-stages`).
const DEV_STAGE_SYNC_INTERVAL_MS = 60 * 60 * 1000;
let devStageSyncTimer = null;

async function runDevStageSync() {
  try {
    const result = await syncStagesStatuts({ notify: true });
    console.log(
      `[sync-stages:dev] scanned=${result.scanned} updated=${result.updated}${
        result.skipped ? " skipped=true" : ""
      }`,
    );
  } catch (error) {
    // Le scheduler de développement ne doit pas faire tomber l'API.
    console.error("[sync-stages:dev] échec :", error?.message || error);
  }
}

const server = app.listen(PORT, "0.0.0.0", async () => {
  console.log(` InternIn API démarrée sur le port ${PORT}`);
  console.log(` Environnement : ${nodeEnv}`);

  try {
    await startRealtimeListener();
  } catch {
    console.error("[realtime] démarrage sans listener distribué ; reconnexion automatique activée.");
  }

  if (nodeEnv === "development") {
    // Première synchronisation immédiate, puis toutes les heures.
    void runDevStageSync();
    devStageSyncTimer = setInterval(runDevStageSync, DEV_STAGE_SYNC_INTERVAL_MS);
    console.log("[sync-stages:dev] scheduler local activé (toutes les heures).");
  }
});

// ============================================================
// Arrêt propre
// ============================================================

async function shutdown(signal) {
  console.log(`\n ${signal} reçu. Arrêt du serveur...`);

  if (devStageSyncTimer) {
    clearInterval(devStageSyncTimer);
    devStageSyncTimer = null;
  }

  await stopRealtimeListener();
  server.close(() => {
    console.log("✅ Serveur arrêté proprement.");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
