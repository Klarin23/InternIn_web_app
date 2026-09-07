/**
 * Resolve the Express trust-proxy policy from configuration.
 *
 * TRUST_PROXY examples:
 *   0                         -> direct access / no trusted proxy
 *   1                         -> exactly one reverse-proxy hop
 *   2                         -> exactly two trusted hops
 *   loopback,linklocal       -> trust only these proxy networks
 *   10.0.0.0/8,192.168.0.0/16 -> trust only these proxy networks
 *
 * Production deliberately requires an explicit value. A guessed hop count
 * can make req.ip spoofable when the API is reachable through a different
 * topology than expected.
 */
export function resolveTrustProxySetting(env = process.env) {
  const raw = env.TRUST_PROXY?.trim();

  if (!raw) {
    if (env.NODE_ENV === "production") {
      throw new Error(
        "TRUST_PROXY doit être explicitement configuré en production (ex: 1 derrière un unique reverse proxy, ou une liste de réseaux de proxy de confiance).",
      );
    }
    return 0;
  }

  if (/^\d+$/.test(raw)) {
    const hops = Number(raw);
    if (!Number.isSafeInteger(hops) || hops < 0 || hops > 10) {
      throw new Error("TRUST_PROXY doit être un nombre entier compris entre 0 et 10.");
    }
    return hops;
  }

  const proxies = raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (proxies.length === 0) {
    throw new Error("TRUST_PROXY ne contient aucun proxy valide.");
  }

  const allowedNames = new Set([
    "loopback",
    "linklocal",
    "uniquelocal",
  ]);

  for (const proxy of proxies) {
    const looksLikeIpOrCidr =
      /^[0-9a-f:.]+(?:\/\d{1,3})?$/i.test(proxy);
    if (!looksLikeIpOrCidr && !allowedNames.has(proxy.toLowerCase())) {
      throw new Error(
        `Entrée TRUST_PROXY invalide: "${proxy}". Utilisez un nombre de hops, une IP/CIDR, ou loopback/linklocal/uniquelocal.`,
      );
    }
  }

  return proxies;
}
