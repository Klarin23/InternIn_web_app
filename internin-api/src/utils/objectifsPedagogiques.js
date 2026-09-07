/**
 * Normalisation des objectifs pédagogiques (offre finale → stage → convention).
 * Source de vérité : texte stocké dans objectifs_apprentissage (lignes numérotées).
 * Les lignes sont aussi copiées dans objectifs_stage à la création du stage.
 */

export const OBJECTIFS_LIMITS = {
  minCount: 1,
  maxCount: 10,
  minLength: 10,
  maxLength: 500,
};

/**
 * @param {string|string[]|null|undefined} input
 * @returns {string[]}
 */
export function parseObjectifsList(input) {
  if (input == null) return [];
  const raw = Array.isArray(input)
    ? input
    : String(input)
        .split(/\r?\n+/)
        .map((l) => l.trim());

  return raw
    .map((s) =>
      String(s || "")
        .replace(/^\d+[\.\)\-]\s*/, "")
        .trim(),
    )
    .filter((s) => s.length > 0);
}

/**
 * @param {string[]} list
 * @returns {string}
 */
export function serializeObjectifsList(list) {
  return list.map((o, i) => `${i + 1}. ${o}`).join("\n");
}

/**
 * Valide une liste d'objectifs. Lance une Error avec status 400 si invalide.
 * @param {string|string[]|null|undefined} input
 * @returns {string[]} liste nettoyée
 */
export function validateObjectifsPedagogiques(input) {
  const list = parseObjectifsList(input);
  const { minCount, maxCount, minLength, maxLength } = OBJECTIFS_LIMITS;

  if (list.length < minCount) {
    const err = new Error(
      "Veuillez définir au moins un objectif pédagogique avant de continuer.",
    );
    err.status = 400;
    throw err;
  }
  if (list.length > maxCount) {
    const err = new Error(
      `Vous ne pouvez pas définir plus de ${maxCount} objectifs pédagogiques.`,
    );
    err.status = 400;
    throw err;
  }

  for (let i = 0; i < list.length; i++) {
    const o = list[i];
    if (o.length < minLength) {
      const err = new Error(
        `L'objectif ${i + 1} est trop court (minimum ${minLength} caractères).`,
      );
      err.status = 400;
      throw err;
    }
    if (o.length > maxLength) {
      const err = new Error(
        `L'objectif ${i + 1} est trop long (maximum ${maxLength} caractères).`,
      );
      err.status = 400;
      throw err;
    }
  }

  return list;
}
