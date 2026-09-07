import "dotenv/config";
import { AsyncLocalStorage } from "node:async_hooks";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const nodeEnv = process.env.NODE_ENV;
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(" DATABASE_URL est absente.");
}

if (!nodeEnv) {
  throw new Error(" NODE_ENV est absent.");
}

let databaseName;

try {
  databaseName = new URL(databaseUrl).pathname.replace(/^\/+/, "");
} catch {
  throw new Error(" DATABASE_URL est invalide.");
}

const expectedDatabaseByEnv = {
  test: "internin_test",
  development: "internin_dev",
  production: "internin",
};

const expectedDatabase = expectedDatabaseByEnv[nodeEnv];

if (!expectedDatabase) {
  throw new Error(
    ` NODE_ENV="${nodeEnv}" n'est pas autorisé. ` +
      `Valeurs attendues : test, development ou production.`,
  );
}

if (databaseName !== expectedDatabase) {
  throw new Error(
    ` SÉCURITÉ : NODE_ENV=${nodeEnv} mais DATABASE_URL pointe vers "${databaseName}". ` +
      `Base attendue : "${expectedDatabase}".`,
  );
}

const pool = new Pool({
  connectionString: databaseUrl,
});

const drizzleDb = drizzle(pool);

// Contexte transactionnel implicite : les services qui oublient de passer
// `tx` explicitement à une opération secondaire (ex. notification) restent
// rattachés à la transaction courante. Cela évite les écritures "fantômes"
// après rollback sans imposer une refactorisation de tous les call sites.
const transactionStorage = new AsyncLocalStorage();

export function getCurrentTransactionExecutor() {
  return transactionStorage.getStore() || null;
}

export const db = new Proxy(drizzleDb, {
  get(target, property, receiver) {
    if (property === "transaction") {
      return (callback, ...args) =>
        target.transaction(
          (tx) => transactionStorage.run(tx, () => callback(tx)),
          ...args,
        );
    }
    return Reflect.get(target, property, receiver);
  },
});

export { pool };
