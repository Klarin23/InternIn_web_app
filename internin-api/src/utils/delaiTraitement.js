/**
 * SLA admin : délai de traitement (heures) depuis parametres_plateforme.
 * Utilisé pour signaler les dossiers en attente hors délai.
 */

import { db } from "../db/index.js";
import { parametresPlateforme } from "../db/schema.js";

export const DELAI_TRAITEMENT_DEFAUT_HEURES = 72;

/**
 * @returns {Promise<number>} délai en heures (>= 1)
 */
export async function getDelaiTraitementHeures() {
  try {
    const [row] = await db
      .select({ delai: parametresPlateforme.delaiTraitementHeures })
      .from(parametresPlateforme)
      .limit(1);
    const n = Number(row?.delai);
    if (Number.isFinite(n) && n >= 1) return Math.min(n, 720);
  } catch {
    /* ignore */
  }
  return DELAI_TRAITEMENT_DEFAUT_HEURES;
}

/**
 * Calcule les métadonnées SLA à partir d'une date de soumission.
 * @param {Date|string|null} dateReference - en général dateCreation
 * @param {number} delaiHeures
 * @param {boolean} [estEncoreEnAttente=true] - si false, enRetard = false
 */
export function computeDelaiMeta(dateReference, delaiHeures, estEncoreEnAttente = true) {
  const delai =
    Number.isFinite(Number(delaiHeures)) && Number(delaiHeures) >= 1
      ? Math.min(Number(delaiHeures), 720)
      : DELAI_TRAITEMENT_DEFAUT_HEURES;

  if (!dateReference) {
    return {
      delaiTraitementHeures: delai,
      heuresEcoulees: null,
      enRetard: false,
      echeanceTraitement: null,
    };
  }

  const debut = new Date(dateReference);
  if (Number.isNaN(debut.getTime())) {
    return {
      delaiTraitementHeures: delai,
      heuresEcoulees: null,
      enRetard: false,
      echeanceTraitement: null,
    };
  }

  const echeance = new Date(debut.getTime() + delai * 60 * 60 * 1000);
  const heuresEcoulees = Math.max(
    0,
    Math.floor((Date.now() - debut.getTime()) / (60 * 60 * 1000)),
  );
  const enRetard = Boolean(estEncoreEnAttente) && Date.now() > echeance.getTime();

  return {
    delaiTraitementHeures: delai,
    heuresEcoulees,
    enRetard,
    echeanceTraitement: echeance.toISOString(),
  };
}

/**
 * Enrichit une liste d'objets avec les champs SLA.
 * @param {object[]} rows
 * @param {(row: object) => Date|string|null} getDate
 * @param {(row: object) => boolean} isPending
 */
export async function enrichWithDelaiTraitement(rows, getDate, isPending) {
  if (!Array.isArray(rows) || rows.length === 0) return rows || [];
  const delai = await getDelaiTraitementHeures();
  return rows.map((row) => {
    const pending = typeof isPending === "function" ? isPending(row) : true;
    const meta = computeDelaiMeta(getDate(row), delai, pending);
    return { ...row, ...meta };
  });
}
