/**
 * Résolution pays / ville à partir d'une IP (best-effort, non bloquant).
 * Utilise ip-api.com (gratuit, sans clé, rate-limité) — timeout court.
 * Les IP privées / locales renvoient "Local".
 */

function isPrivateIp(ip) {
  if (!ip) return true;
  const s = String(ip).replace("::ffff:", "");
  if (s === "::1" || s === "127.0.0.1" || s === "localhost") return true;
  if (s.startsWith("10.") || s.startsWith("192.168.") || s.startsWith("127."))
    return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(s)) return true;
  return false;
}

/**
 * @param {string|null|undefined} ip
 * @returns {Promise<{ pays: string|null, ville: string|null }>}
 */
export async function resolveGeoFromIp(ip) {
  if (!ip) return { pays: null, ville: null };
  const clean = String(ip).replace("::ffff:", "").trim();

  if (isPrivateIp(clean)) {
    return { pays: "Local", ville: "Local" };
  }

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2000);
    const url = `http://ip-api.com/json/${encodeURIComponent(clean)}?fields=status,country,city`;
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return { pays: null, ville: null };
    const data = await res.json();
    if (data?.status !== "success") return { pays: null, ville: null };
    return {
      pays: data.country ? String(data.country).slice(0, 100) : null,
      ville: data.city ? String(data.city).slice(0, 100) : null,
    };
  } catch {
    return { pays: null, ville: null };
  }
}
