/**
 * Redaction centralisée des secrets transportés dans les URL.
 * Sépare la donnée métier (token utilisable par le contrôleur)
 * de ce qui est écrit dans les logs.
 *
 * Ne jamais logger un secret partiel (préfixe) ni un hash du token.
 */
const QUERY_SECRET_KEYS = [
  "token",
  "access_token",
  "refresh_token",
  "reset_token",
  "verification_token",
  "invite_token",
  "invitation_token",
  "code",
  "otp",
];

const REDACTED = "[REDACTED]";

const QUERY_KEY_SET = new Set(QUERY_SECRET_KEYS.map((k) => k.toLowerCase()));

/**
 * @param {string} rawUrl - url, originalUrl, path, or full URL
 * @returns {string}
 */
export function redactSensitiveUrl(rawUrl) {
  if (rawUrl == null) return rawUrl;
  let url = String(rawUrl);
  if (!url) return url;

  // 1) Query params — replace secret values without re-encoding markers
  const qIndex = url.indexOf("?");
  if (qIndex !== -1) {
    const base = url.slice(0, qIndex);
    let rest = url.slice(qIndex + 1);
    let hash = "";
    const hashIndex = rest.indexOf("#");
    if (hashIndex >= 0) {
      hash = rest.slice(hashIndex);
      rest = rest.slice(0, hashIndex);
    }
    const parts = rest.split("&").filter(Boolean);
    const next = parts.map((pair) => {
      const eq = pair.indexOf("=");
      const rawKey = eq >= 0 ? pair.slice(0, eq) : pair;
      let key = rawKey;
      try {
        key = decodeURIComponent(rawKey.replace(/\+/g, " "));
      } catch {
        /* keep raw */
      }
      if (QUERY_KEY_SET.has(String(key).toLowerCase())) {
        return `${rawKey}=${REDACTED}`;
      }
      return pair;
    });
    url = next.length ? `${base}?${next.join("&")}${hash}` : `${base}${hash}`;
  }

  // 2) Path segments that carry invitation tokens
  url = url.replace(
    /(\/invitations?\/)([^/?#]+)/gi,
    `$1${REDACTED}`,
  );

  return url;
}

/**
 * Redacte une URL complète éventuelle dans un texte libre (corps d'e-mail, etc.).
 */
export function redactSensitiveText(text) {
  if (text == null) return text;
  let s = String(text);
  s = s.replace(
    /([?&](?:token|access_token|refresh_token|reset_token|verification_token|invite_token|invitation_token)=)[^&\s"'<>]+/gi,
    `$1${REDACTED}`,
  );
  s = s.replace(/(\/invitations?\/)[^/?#\s"'<>]+/gi, `$1${REDACTED}`);
  return s;
}

export { REDACTED, QUERY_SECRET_KEYS };
