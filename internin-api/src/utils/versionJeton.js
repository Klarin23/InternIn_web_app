// Révocation immédiate des access JWT via version de jeton (versionJeton).
// Complète (ne remplace pas) le système de refresh tokens hashés en BDD.

import { eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { utilisateurs } from "../db/schema.js";
import { signToken } from "./jwt.js";

/**
 * Incrémente versionJeton pour un utilisateur (révoque tous les access JWT en cours).
 * @param {string} idUtilisateur
 * @param {import('drizzle-orm').NodePgDatabase} [tx] transaction optionnelle
 */
export async function incrementerVersionJeton(idUtilisateur, tx = db) {
  if (!idUtilisateur) return;
  await tx
    .update(utilisateurs)
    .set({
      versionJeton: sql`${utilisateurs.versionJeton} + 1`,
      dateMaj: new Date(),
    })
    .where(eq(utilisateurs.idUtilisateur, idUtilisateur));
}

/**
 * Construit et signe un access JWT avec la versionJeton courante.
 * @param {{ idUtilisateur: string, typeUtilisateur: string, versionJeton?: number }} user
 */
export function signAccessToken(user) {
  return signToken({
    idUtilisateur: user.idUtilisateur,
    typeUtilisateur: user.typeUtilisateur,
    versionJeton: user.versionJeton ?? 0,
  });
}
