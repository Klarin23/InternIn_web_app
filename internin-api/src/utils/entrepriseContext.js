// Résolution centralisée du contexte entreprise pour un utilisateur connecté.
// Accepte le propriétaire (typeUtilisateur="entreprise") OU un membre d'équipe
// actif (typeUtilisateur="membre_entreprise").
//
// Utilisé par les middlewares de permission et les services métier pour
// garantir que les membres d'équipe opèrent bien dans le périmètre de
// leur entreprise (protection IDOR).
//
// SOURCE DE VÉRITÉ unique pour les permissions effectives :
//   computePermissionsEffectives(membre)
//   hasEntreprisePermission(ctx | membre, cle)
//   getUtilisateursAvecPermission(idEntreprise, cle)
// API, UI (via /equipe/moi) et notifications doivent s'appuyer sur ces helpers.

import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { entreprises, membresEquipe } from "../db/schema.js";
import {
  PERMISSIONS_PAR_DEFAUT_ROLE,
  CLES_PERMISSIONS,
} from "../modules/equipe/equipe.constants.js";

// Types de comptes autorisés à accéder au contexte d'une entreprise.
// Toute vérification d'appartenance doit ensuite passer par
// resolveEntrepriseContext(), qui contrôle aussi l'activité du membre.
export const TYPES_CONTEXTE_ENTREPRISE = Object.freeze([
  "entreprise",
  "membre_entreprise",
]);

/**
 * Calcule les permissions effectives d'un membre d'équipe (ligne DB).
 * Règles (identiques à resolveEntrepriseContext) :
 * - estAdminPrincipal → toutes les permissions
 * - sinon permissionsPersonnalisees si définies
 * - sinon PERMISSIONS_PAR_DEFAUT_ROLE[roleEquipe]
 * - sinon []
 */
export function computePermissionsEffectives(membre) {
  if (!membre) return [];
  if (membre.estAdminPrincipal) return [...CLES_PERMISSIONS];
  return (
    membre.permissionsPersonnalisees ??
    PERMISSIONS_PAR_DEFAUT_ROLE[membre.roleEquipe] ??
    []
  );
}

/**
 * Vérifie si un contexte entreprise (ou un membre) possède une permission.
 *
 * @param {object} ctxOrMembre - résultat de resolveEntrepriseContext OU ligne membre
 * @param {string} clePermission - ex. "candidats.gerer"
 * @returns {boolean}
 */
export function hasEntreprisePermission(ctxOrMembre, clePermission) {
  if (!ctxOrMembre || !clePermission) return false;

  // Contexte résolu (propriétaire / admin / membre)
  if (ctxOrMembre.isProprietaire || ctxOrMembre.isAdminPrincipal) return true;
  if (Array.isArray(ctxOrMembre.permissionsEffectives)) {
    return ctxOrMembre.permissionsEffectives.includes(clePermission);
  }

  // Ligne membre brute
  if (ctxOrMembre.estAdminPrincipal) return true;
  if (ctxOrMembre.statutMembre && ctxOrMembre.statutMembre !== "actif") {
    return false;
  }
  return computePermissionsEffectives(ctxOrMembre).includes(clePermission);
}

/**
 * Résout l'entreprise + le membre (si applicable) pour un idUtilisateur.
 * @returns {{ entreprise, membre, isProprietaire, isAdminPrincipal, permissionsEffectives } | null}
 */
export async function resolveEntrepriseContext(idUtilisateur) {
  // 1) Propriétaire
  const [entrepriseProprio] = await db
    .select()
    .from(entreprises)
    .where(eq(entreprises.idUtilisateur, idUtilisateur));

  if (entrepriseProprio) {
    return {
      entreprise: entrepriseProprio,
      membre: null,
      isProprietaire: true,
      isAdminPrincipal: true,
      permissionsEffectives: [...CLES_PERMISSIONS],
    };
  }

  // 2) Membre d'équipe actif uniquement
  const [membre] = await db
    .select()
    .from(membresEquipe)
    .where(
      and(
        eq(membresEquipe.idUtilisateur, idUtilisateur),
        eq(membresEquipe.statutMembre, "actif"),
      ),
    );

  if (!membre) {
    return null;
  }

  const [entreprise] = await db
    .select()
    .from(entreprises)
    .where(eq(entreprises.idEntreprise, membre.idEntreprise));

  if (!entreprise) {
    return null;
  }

  return {
    entreprise,
    membre,
    isProprietaire: false,
    isAdminPrincipal: !!membre.estAdminPrincipal,
    permissionsEffectives: computePermissionsEffectives(membre),
  };
}

/**
 * Comme resolveEntrepriseContext mais lance une erreur 404 si introuvable.
 */
export async function resolveEntrepriseContextOrThrow(idUtilisateur) {
  const ctx = await resolveEntrepriseContext(idUtilisateur);
  if (!ctx) {
    const err = new Error("Profil entreprise introuvable");
    err.status = 404;
    throw err;
  }
  return ctx;
}

/**
 * Vérifie qu'une ressource appartient bien à l'entreprise du contexte.
 * Lance 403 en cas d'IDOR.
 */
export function assertResourceBelongsToEntreprise(resourceEntrepriseId, ctx) {
  if (
    !resourceEntrepriseId ||
    resourceEntrepriseId !== ctx.entreprise.idEntreprise
  ) {
    const err = new Error("Accès refusé à cette ressource.");
    err.status = 403;
    throw err;
  }
}

/**
 * Retourne les idUtilisateur des destinataires entreprise autorisés pour
 * une permission donnée (ex. notifications candidatures / entretiens).
 *
 * Inclut :
 * - le propriétaire du compte entreprise
 * - les membres actifs ayant la permission (ou admin principal)
 *
 * Exclut :
 * - membres désactivés / invités
 * - membres d'une autre entreprise
 * - membres sans la permission requise
 *
 * Source de vérité unique : computePermissionsEffectives / hasEntreprisePermission.
 *
 * @param {string} idEntreprise
 * @param {string} clePermission - ex. "candidats.gerer"
 * @returns {Promise<string[]>} idUtilisateur uniques
 */
export async function getUtilisateursAvecPermission(
  idEntreprise,
  clePermission,
) {
  const ids = new Set();

  const [entreprise] = await db
    .select({ idUtilisateur: entreprises.idUtilisateur })
    .from(entreprises)
    .where(eq(entreprises.idEntreprise, idEntreprise));

  if (entreprise?.idUtilisateur) {
    ids.add(entreprise.idUtilisateur);
  }

  const membres = await db
    .select({
      idUtilisateur: membresEquipe.idUtilisateur,
      estAdminPrincipal: membresEquipe.estAdminPrincipal,
      roleEquipe: membresEquipe.roleEquipe,
      permissionsPersonnalisees: membresEquipe.permissionsPersonnalisees,
      statutMembre: membresEquipe.statutMembre,
    })
    .from(membresEquipe)
    .where(
      and(
        eq(membresEquipe.idEntreprise, idEntreprise),
        eq(membresEquipe.statutMembre, "actif"),
      ),
    );

  for (const m of membres) {
    if (!m.idUtilisateur) continue;
    if (hasEntreprisePermission(m, clePermission)) {
      ids.add(m.idUtilisateur);
    }
  }

  return [...ids];
}
