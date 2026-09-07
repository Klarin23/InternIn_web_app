#!/usr/bin/env node
/**
 * Migre les anciens tokens d'invitation stockés en clair vers SHA-256.
 * À exécuter une fois après déploiement si la base contient déjà des invitations.
 */
import { createHash } from "node:crypto";
import { db } from "../src/db/index.js";
import { membresEquipe } from "../src/db/schema.js";
import { eq } from "drizzle-orm";

function hashInvitationToken(token) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

const membres = await db
  .select({ idMembre: membresEquipe.idMembre, tokenInvitation: membresEquipe.tokenInvitation })
  .from(membresEquipe)
  .where(eq(membresEquipe.statutMembre, "invite"));

let migres = 0;
for (const membre of membres) {
  if (!membre.tokenInvitation) continue;
  const hashed = hashInvitationToken(membre.tokenInvitation);
  if (hashed === membre.tokenInvitation) continue;
  await db
    .update(membresEquipe)
    .set({ tokenInvitation: hashed })
    .where(eq(membresEquipe.idMembre, membre.idMembre));
  migres += 1;
}

console.log(`Migration des tokens d'invitation terminée : ${migres} invitation(s) migrée(s).`);
process.exit(0);
