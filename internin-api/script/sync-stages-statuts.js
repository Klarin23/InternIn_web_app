/**
 * Job idempotent : synchronise stages.statut avec le cycle de vie temporel.
 *
 * a_venir  → actif   quand dateDebut atteinte
 * actif    → termine quand dateFinPrevue dépassée
 *
 * Ne touche jamais aux stages "interrompu".
 * En production, ce job doit être exécuté par un scheduler dédié
 * (cron, Cloud Scheduler, worker unique, etc.). En développement,
 * `npm run dev` l'exécute automatiquement pour conserver un environnement
 * local complet. Un verrou PostgreSQL empêche malgré tout deux exécutions
 * concurrentes.
 *
 * Usage : node script/sync-stages-statuts.js
 */
import "dotenv/config";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "../src/db/index.js";
import { stages, stagiaires } from "../src/db/schema.js";
import {
  getStageLifecycleStatus,
} from "../src/utils/stageLifecycle.js";
import {
  creerNotification,
  emitNotificationCreated,
} from "../src/modules/notifications/notifications.service.js";

const STAGE_SYNC_LOCK_KEY = "internin:job:sync-stages-statuts:v1";

export async function syncStagesStatuts({ notify = true } = {}) {
  const { result, notificationsToEmit } = await db.transaction(async (tx) => {
    // Verrou distribué transactionnel : une seule instance / exécution peut
    // synchroniser les stages à la fois. Le verrou est libéré automatiquement
    // au COMMIT/ROLLBACK, y compris si le processus tombe.
    const lockResult = await tx.execute(
      sql`SELECT pg_try_advisory_xact_lock(
        hashtextextended(${STAGE_SYNC_LOCK_KEY}, 0)
      ) AS acquired`,
    );

    if (!lockResult?.[0]?.acquired) {
      return {
        result: { scanned: 0, updated: 0, skipped: true },
        notificationsToEmit: [],
      };
    }

    const rows = await tx
      .select({
        idStage: stages.idStage,
        idStagiaire: stages.idStagiaire,
        dateDebut: stages.dateDebut,
        dateFinPrevue: stages.dateFinPrevue,
        dateFinReelle: stages.dateFinReelle,
        statut: stages.statut,
      })
      .from(stages)
      .where(inArray(stages.statut, ["a_venir", "actif"]));

    let updated = 0;
    const notificationsToEmit = [];

    for (const row of rows) {
      const next = getStageLifecycleStatus(row);
      if (next === row.statut) continue;

      await tx
        .update(stages)
        .set({
          statut: next,
          ...(next === "termine" && !row.dateFinReelle
            ? { dateFinReelle: row.dateFinPrevue }
            : {}),
        })
        .where(eq(stages.idStage, row.idStage));

      updated += 1;

      if (notify && next === "actif" && row.statut === "a_venir") {
        try {
          const [stag] = await tx
            .select({ idUtilisateur: stagiaires.idUtilisateur })
            .from(stagiaires)
            .where(eq(stagiaires.idStagiaire, row.idStagiaire))
            .limit(1);
          if (stag?.idUtilisateur) {
            const notif = await creerNotification(
              {
                idUtilisateur: stag.idUtilisateur,
                type: "stage_demarre",
                titre: "Votre stage commence aujourd'hui",
                message:
                  "Le suivi, le journal et la messagerie de stage sont désormais disponibles.",
                lien: "/stage",
              },
              tx,
            );
            if (notif) notificationsToEmit.push(notif);
          }
        } catch (e) {
          // Une erreur de notification ne doit pas empêcher la transition du
          // stage, comme dans le comportement historique du job.
          console.error("[sync-stages] notif failed", e?.message);
        }
      }
    }

    return {
      result: { scanned: rows.length, updated, skipped: false },
      notificationsToEmit,
    };
  });

  // Les notifications sont publiées uniquement après le commit de la
  // transaction, afin de ne jamais annoncer un changement finalement rollbacké.
  for (const notif of notificationsToEmit) {
    emitNotificationCreated(notif);
  }

  return result;
}

// CLI
const isMain =
  process.argv[1] &&
  (process.argv[1].endsWith("sync-stages-statuts.js") ||
    process.argv[1].includes("sync-stages-statuts"));

if (isMain) {
  syncStagesStatuts()
    .then((r) => {
      console.log(`[sync-stages] scanned=${r.scanned} updated=${r.updated}`);
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
