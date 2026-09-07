/**
 * Normalise une URL média (photo profil, logo) pour l'affichage navigateur.
 *
 * Les uploads sont stockés en URL absolue API (ex. http://localhost:4000/uploads/...).
 * Pour rester compatible CSP (img-src 'self') et le rewrite Next /uploads → API,
 * on convertit en chemin relatif /uploads/... quand possible.
 *
 * @param {string|null|undefined} url
 * @returns {string|null}
 */
export function mediaUrl(url) {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Déjà relatif
  if (trimmed.startsWith("/uploads/")) return trimmed;
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) return trimmed;

  try {
    const u = new URL(trimmed);
    if (u.pathname.startsWith("/uploads/")) {
      return u.pathname + u.search;
    }
  } catch {
    /* ignore */
  }

  return trimmed;
}
