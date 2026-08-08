import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { notifications, administrateurs } from "../../db/schema.js";

// Appelée depuis les autres modules (entretiens, etc.) au moment d'un
// évènement métier — jamais exposée directement via une route HTTP.
export async function creerNotification({
  idUtilisateur,
  type,
  titre,
  message,
  lien,
}) {
  const [notif] = await db
    .insert(notifications)
    .values({ idUtilisateur, type, titre, message, lien: lien || null })
    .returning();
  return notif;
}

// Notifie tous les comptes administrateur d'un coup (file de modération
// partagée : offres finales à valider, signalements à traiter...).
export async function notifierAdmins({ type, titre, message, lien }) {
  const tousLesAdmins = await db
    .select({ idUtilisateur: administrateurs.idUtilisateur })
    .from(administrateurs);

  await Promise.all(
    tousLesAdmins.map((a) =>
      creerNotification({
        idUtilisateur: a.idUtilisateur,
        type,
        titre,
        message,
        lien,
      }),
    ),
  );
}

export async function listNotifications(idUtilisateur, { limite = 30 } = {}) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.idUtilisateur, idUtilisateur))
    .orderBy(desc(notifications.dateCreation))
    .limit(limite);
}

export async function compterNonLues(idUtilisateur) {
  const [{ count }] = await db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(notifications)
    .where(
      and(
        eq(notifications.idUtilisateur, idUtilisateur),
        eq(notifications.lu, false),
      ),
    );
  return count;
}

export async function marquerCommeLue(idUtilisateur, idNotification) {
  const [notif] = await db
    .update(notifications)
    .set({ lu: true })
    .where(
      and(
        eq(notifications.idNotification, idNotification),
        eq(notifications.idUtilisateur, idUtilisateur),
      ),
    )
    .returning();

  if (!notif) {
    const err = new Error("Notification introuvable");
    err.status = 404;
    throw err;
  }
  return notif;
}

export async function marquerToutesCommeLues(idUtilisateur) {
  await db
    .update(notifications)
    .set({ lu: true })
    .where(
      and(
        eq(notifications.idUtilisateur, idUtilisateur),
        eq(notifications.lu, false),
      ),
    );
}

export async function supprimerNotification(idUtilisateur, idNotification) {
  const [notif] = await db
    .delete(notifications)
    .where(
      and(
        eq(notifications.idNotification, idNotification),
        eq(notifications.idUtilisateur, idUtilisateur),
      ),
    )
    .returning();

  if (!notif) {
    const err = new Error("Notification introuvable");
    err.status = 404;
    throw err;
  }
  return notif;
}

export async function supprimerToutesNotifications(idUtilisateur) {
  await db
    .delete(notifications)
    .where(eq(notifications.idUtilisateur, idUtilisateur));
}