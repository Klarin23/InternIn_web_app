import { db } from "../src/db/index.js";
import { notifications, utilisateurs } from "../src/db/schema.js";
import { eq, sql } from "drizzle-orm";
import {
  creerNotification,
  emitNotificationCreated,
} from "../src/modules/notifications/notifications.service.js";

async function main() {
  const [user] = await db
    .select({ idUtilisateur: utilisateurs.idUtilisateur })
    .from(utilisateurs)
    .limit(1);
  if (!user) {
    console.error("Aucun utilisateur en base de test");
    process.exit(1);
  }

  const before = await db
    .select({ c: sql`count(*)`.mapWith(Number) })
    .from(notifications)
    .where(eq(notifications.idUtilisateur, user.idUtilisateur));

  try {
    await db.transaction(async (tx) => {
      await creerNotification(
        {
          idUtilisateur: user.idUtilisateur,
          type: "test_rollback_notif",
          titre: "Test rollback",
          message: "Ne doit pas rester en base",
          lien: null,
        },
        tx,
      );
      throw new Error("force_rollback");
    });
  } catch (e) {
    if (e.message !== "force_rollback") throw e;
  }

  const afterRollback = await db
    .select({ c: sql`count(*)`.mapWith(Number) })
    .from(notifications)
    .where(eq(notifications.idUtilisateur, user.idUtilisateur));

  if (afterRollback[0].c !== before[0].c) {
    console.error("[rollback] ÉCHEC — notification persistée après rollback");
    process.exitCode = 1;
  } else {
    console.log("[rollback] OK — notification absente après rollback");
  }

  let created = null;
  await db.transaction(async (tx) => {
    created = await creerNotification(
      {
        idUtilisateur: user.idUtilisateur,
        type: "test_commit_notif",
        titre: "Test commit",
        message: "Doit rester en base",
        lien: null,
      },
      tx,
    );
  });
  if (created) emitNotificationCreated(created);

  const [row] = await db
    .select()
    .from(notifications)
    .where(eq(notifications.idNotification, created.idNotification));

  if (!row) {
    console.error("[commit] ÉCHEC — notification absente après commit");
    process.exitCode = 1;
  } else {
    console.log("[commit] OK — notification présente après commit");
  }

  if (created?.idNotification) {
    await db
      .delete(notifications)
      .where(eq(notifications.idNotification, created.idNotification));
  }

  process.exit(process.exitCode || 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
