/**
 * Lecture centralisée du paramètre "validation automatique" + éléments cochés.
 * Source de vérité : table parametres_plateforme (singleton).
 */

import { db } from "../db/index.js";
import { parametresPlateforme } from "../db/schema.js";

export const ELEMENT_OFFRES_FINALES = "offres_finales";
export const ELEMENT_CONVENTIONS = "conventions";
export const ELEMENT_ENTREPRISES = "entreprises";
export const ELEMENT_UNIVERSITES = "universites";

/**
 * @param {string} elementCle - une des clés ELEMENT_*
 * @returns {Promise<boolean>}
 */
export async function isAutoValidationEnabled(elementCle) {
  if (!elementCle) return false;
  try {
    const [row] = await db.select().from(parametresPlateforme).limit(1);
    if (!row?.validationAutomatique) return false;
    const list = Array.isArray(row.elementsValidationAutomatique)
      ? row.elementsValidationAutomatique
      : [];
    return list.includes(elementCle);
  } catch {
    // Ne jamais bloquer un flux métier si la table params est indisponible
    return false;
  }
}
