/**
 * Validation centralisée des URLs fournies par l'utilisateur (profils
 * stagiaire/entreprise : site web, LinkedIn, GitHub, portfolio, Behance...).
 *
 * Principe : toute URL provenant du client (req.body) est non fiable tant
 * qu'elle n'a pas été validée ici. On utilise le parseur natif `new URL()`
 * plutôt qu'une regex, avec une whitelist de protocoles (https par défaut)
 * — jamais une blacklist.
 *
 * Ce module est la source de vérité côté serveur ; le frontend ne fait que
 * dupliquer une validation légère pour l'UX (voir
 * internin-web/lib/utils/urlValidation.js).
 */

export const MAX_URL_LENGTH = 2048;

const DEFAULT_ALLOWED_PROTOCOLS = ["https:"];

const LINKEDIN_HOSTS = new Set(["linkedin.com", "www.linkedin.com"]);
const GITHUB_HOSTS = new Set(["github.com", "www.github.com"]);

/**
 * Valide une URL externe générique.
 * @param {string} raw
 * @param {{allowedProtocols?: string[], maxLength?: number, required?: boolean}} [opts]
 * @returns {{ok: true, value: string} | {ok: false, code: string}}
 */
export function checkExternalUrl(raw, opts = {}) {
  const {
    allowedProtocols = DEFAULT_ALLOWED_PROTOCOLS,
    maxLength = MAX_URL_LENGTH,
    required = false,
  } = opts;

  const value = typeof raw === "string" ? raw.trim() : "";

  if (!value) {
    return required ? { ok: false, code: "invalid" } : { ok: true, value: "" };
  }

  if (value.length > maxLength) {
    return { ok: false, code: "tooLong" };
  }

  let url;
  try {
    url = new URL(value);
  } catch {
    return { ok: false, code: "invalid" };
  }

  if (!allowedProtocols.includes(url.protocol)) {
    const httpsOnly =
      allowedProtocols.length === 1 && allowedProtocols[0] === "https:";
    return { ok: false, code: httpsOnly ? "httpsRequired" : "invalid" };
  }

  if (!url.hostname) {
    return { ok: false, code: "invalid" };
  }

  // Les identifiants intégrés dans l'URL n'ont pas leur place dans un profil
  // public : https://user:pass@example.com
  if (url.username || url.password) {
    return { ok: false, code: "credentialsNotAllowed" };
  }

  return { ok: true, value: url.toString() };
}

function checkDomainUrl(raw, hosts, opts) {
  const res = checkExternalUrl(raw, opts);
  if (!res.ok || !res.value) return res;
  const hostname = new URL(res.value).hostname.toLowerCase();
  if (!hosts.has(hostname)) {
    return { ok: false, code: "domainMismatch" };
  }
  return res;
}

/** Exige un lien linkedin.com / www.linkedin.com */
export function checkLinkedInUrl(raw, opts) {
  const res = checkDomainUrl(raw, LINKEDIN_HOSTS, opts);
  if (!res.ok && res.code === "domainMismatch") {
    return { ok: false, code: "linkedinInvalid" };
  }
  return res;
}

/** Exige un lien github.com / www.github.com */
export function checkGitHubUrl(raw, opts) {
  const res = checkDomainUrl(raw, GITHUB_HOSTS, opts);
  if (!res.ok && res.code === "domainMismatch") {
    return { ok: false, code: "githubInvalid" };
  }
  return res;
}

/**
 * Construit un refinement Zod réutilisable à partir d'une fonction de
 * validation ci-dessus. Le champ reste `z.string().optional()` (on ne
 * change pas l'obligation existante des champs), on ajoute seulement la
 * validation de format/sécurité.
 *
 * @param {(raw: string, opts?: object) => {ok: boolean, code?: string}} checker
 * @param {object} [checkerOpts]
 */
export function zUrlField(checker, checkerOpts) {
  return (schema) =>
    schema.superRefine((val, ctx) => {
      const res = checker(val, checkerOpts);
      if (!res.ok) {
        ctx.addIssue({
          code: "custom",
          message: `validation.url.${res.code}`,
        });
      }
    });
}
