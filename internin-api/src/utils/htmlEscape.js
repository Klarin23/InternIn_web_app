// Échappement HTML pour les valeurs dynamiques insérées dans des templates
// HTML construits par simple interpolation de chaîne (ex. e-mails
// transactionnels dans utils/email.js).
//
// Objectif : empêcher qu'une donnée non fiable (ex. nom d'entreprise saisi
// librement lors de l'onboarding) ne devienne du balisage HTML interprété.
// Ce n'est PAS un sanitizer : on n'autorise aucun sous-ensemble de HTML, on
// transforme les caractères sensibles en leur forme textuelle équivalente.
//
// Ne pas utiliser pour stocker une version "échappée" en base — l'échappement
// doit toujours être appliqué au moment du rendu HTML, jamais avant.

const HTML_ESCAPE_MAP = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/**
 * Échappe les caractères HTML sensibles d'une valeur pour un usage sûr en
 * contexte HTML (texte ou attribut entre guillemets doubles ou simples).
 * Retourne une chaîne vide pour null/undefined ; convertit toute autre
 * valeur non-string en string avant échappement.
 */
export function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char]);
}

/**
 * Retire les caractères de contrôle (retours à la ligne, tabulations, etc.)
 * d'une valeur destinée à un contexte sensible aux caractères de contrôle
 * (ex. sujet d'e-mail), sans modifier la donnée telle que stockée en base.
 * Les caractères de contrôle sont remplacés par un espace, puis les espaces
 * en début/fin sont retirés.
 */
export function stripControlChars(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1F\x7F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
