/**
 * Indicateurs "nouveauté" admin — état persistant côté serveur.
 *
 * Le navigateur ne sert plus de source de vérité : les états de vue sont
 * rattachés au compte authentifié et restent donc cohérents entre appareils,
 * onglets et navigateurs.
 */
import {
  getEtatVueRequest,
  markEtatVueRequest,
} from "@/lib/api/etatsVue";

const EVENT = "internin-admin-seen";
const cache = new Map();

function cacheKey(userId, resource) {
  return `${userId}:${resource}`;
}

function getCached(userId, resource) {
  if (!userId || !resource) return null;
  return cache.get(cacheKey(userId, resource)) || null;
}

/** Charge l'état serveur d'une ressource admin dans le cache mémoire. */
export async function loadAdminSeen(userId, resource) {
  if (!userId || !resource) return null;
  const state = await getEtatVueRequest(resource);
  cache.set(cacheKey(userId, resource), state);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENT));
  }
  return state;
}

export function subscribeAdminSeen(onChange) {
  if (typeof window === "undefined") return () => {};
  const handler = () => onChange();
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

export function getAdminSeenAt(userId, resource) {
  return getCached(userId, resource)?.dateDerniereVue || null;
}

/** Marque la section comme vue côté serveur. */
export async function markAdminSectionSeen(userId, resource) {
  if (!userId || !resource) return null;

  const state = await markEtatVueRequest(resource, { action: "section" });
  cache.set(cacheKey(userId, resource), state);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENT));
  }

  return state;
}

export function getAdminSeenIds(userId, resource) {
  return getCached(userId, resource)?.idsVus || [];
}

/** Marque un élément précis comme vu côté serveur. */
export async function markAdminItemSeen(userId, resource, id) {
  if (!userId || !resource || !id) return null;

  const state = await markEtatVueRequest(resource, {
    action: "item",
    id: String(id),
  });
  cache.set(cacheKey(userId, resource), state);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENT));
  }

  return state;
}

export function isAdminItemNew(userId, resource, id, dateCreation) {
  if (!id) return false;
  const seenIds = getAdminSeenIds(userId, resource);
  if (seenIds.includes(String(id))) return false;

  const seenAt = getAdminSeenAt(userId, resource);
  if (!dateCreation) return !seenAt;
  if (!seenAt) return true;

  return new Date(dateCreation).getTime() > new Date(seenAt).getTime();
}

export function hasAdminDot(userId, resource, latestActivityIso) {
  if (!latestActivityIso) return false;
  const seenAt = getAdminSeenAt(userId, resource);
  if (!seenAt) return true;

  return (
    new Date(latestActivityIso).getTime() > new Date(seenAt).getTime()
  );
}
