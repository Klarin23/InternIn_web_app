// Validation côté client des URLs de profil (site web, LinkedIn, GitHub...).
// Sert uniquement à l'UX (message d'erreur immédiat) : le backend
// (internin-api/src/utils/urlValidation.js) revalide systématiquement et
// reste la source de vérité en cas de désaccord.

export const MAX_URL_LENGTH = 2048;

const DEFAULT_ALLOWED_PROTOCOLS = ["https:"];

const LINKEDIN_HOSTS = new Set(["linkedin.com", "www.linkedin.com"]);
const GITHUB_HOSTS = new Set(["github.com", "www.github.com"]);

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

export function checkLinkedInUrl(raw, opts) {
  const res = checkDomainUrl(raw, LINKEDIN_HOSTS, opts);
  if (!res.ok && res.code === "domainMismatch") {
    return { ok: false, code: "linkedinInvalid" };
  }
  return res;
}

export function checkGitHubUrl(raw, opts) {
  const res = checkDomainUrl(raw, GITHUB_HOSTS, opts);
  if (!res.ok && res.code === "domainMismatch") {
    return { ok: false, code: "githubInvalid" };
  }
  return res;
}

/**
 * Retourne une URL sûre à utiliser dans un `href`/`src`, ou `null` si elle
 * doit être considérée comme dangereuse (protocole non autorisé, credentials
 * embarqués...). Utilisé comme filet de sécurité côté affichage, y compris
 * pour d'anciennes données enregistrées avant la validation stricte.
 */
export function safeHref(raw, opts) {
  const res = checkExternalUrl(raw, {
    allowedProtocols: ["https:", "http:"],
    ...opts,
  });
  return res.ok && res.value ? res.value : null;
}

const MESSAGES_FR = {
  invalid: "URL invalide.",
  httpsRequired: "Le lien doit utiliser HTTPS.",
  linkedinInvalid: "Ce lien LinkedIn n'est pas valide.",
  githubInvalid: "Ce lien GitHub n'est pas valide.",
  tooLong: "L'URL est trop longue.",
  credentialsNotAllowed:
    "Les identifiants intégrés dans une URL ne sont pas autorisés.",
};

/**
 * Fabrique un refinement Zod à partir d'une fonction de vérification
 * ci-dessus, pour remplacer les regex fragiles utilisées dans les schémas
 * de formulaire (`/^https?:\/\/.+/`).
 *
 * Zod v4 a retiré la possibilité de passer une fonction comme 2e argument
 * de `.refine()` pour calculer un message dynamique (accepté silencieusement
 * mais ignoré, ce qui affichait le message générique "Invalid input") — on
 * utilise donc `.superRefine()` + `ctx.addIssue()`, comme côté backend.
 *
 * Les messages d'erreur restent en français en dur, comme le reste de la
 * validation frontend existante (ces schémas ne sont pas branchés sur le
 * système i18n) — on ne change pas ce comportement.
 */
export function zUrlField(checker, checkerOpts) {
  return (schema) =>
    schema.superRefine((val, ctx) => {
      const res = checker(val, checkerOpts);
      if (!res.ok) {
        ctx.addIssue({
          code: "custom",
          message: MESSAGES_FR[res.code] || MESSAGES_FR.invalid,
        });
      }
    });
}
