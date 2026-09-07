/**
 * Accusé de réception local des alertes de sécurité (acknowledged ≠ resolved).
 * Pas de backend : localStorage par admin, invalidé si l'état serveur change.
 */

const EVENT = "internin-security-alert-ack";

// Révision stable incrémentée uniquement quand l'état d'ack change réellement
// (événement custom ou "storage" cross-onglet). useSyncExternalStore exige un
// getSnapshot() qui renvoie la MÊME valeur tant que rien n'a changé — un
// Date.now() y provoquerait une boucle de re-render infinie.
let ackRevision = 0;

export function getSecurityAlertAckRevision() {
  return ackRevision;
}

function storageKey(userId) {
  return `internin:securityAlertAck:${userId}`;
}

export function subscribeSecurityAlertAck(onChange) {
  if (typeof window === "undefined") return () => {};
  const handler = () => {
    ackRevision += 1;
    onChange();
  };
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

/**
 * Fingerprint stable de l'état d'alerte courant.
 * Change si gravité / message / compteurs critiques évoluent → réaffiche la bannière.
 */
export function securityAlertFingerprint(overview) {
  if (!overview) return null;
  const etat = overview.etat || "securisee";
  if (etat === "securisee") return null;
  const kpi = overview.kpi || {};
  return [
    etat,
    overview.etatLabel || "",
    kpi.comptesSuspectsCritiques ?? 0,
    kpi.comptesSuspects ?? 0,
    (overview.priorites || []).length,
  ].join("|");
}

export function getSecurityAlertAck(userId) {
  if (typeof window === "undefined" || !userId) return null;
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** true si l'admin a déjà acknowledged cet état précis */
export function isSecurityAlertAcknowledged(userId, fingerprint) {
  if (!fingerprint) return true;
  const ack = getSecurityAlertAck(userId);
  return !!ack && ack.fingerprint === fingerprint;
}

export function acknowledgeSecurityAlert(userId, fingerprint) {
  if (typeof window === "undefined" || !userId || !fingerprint) return;
  localStorage.setItem(
    storageKey(userId),
    JSON.stringify({
      fingerprint,
      acknowledgedAt: new Date().toISOString(),
    }),
  );
  window.dispatchEvent(new Event(EVENT));
}

export function clearSecurityAlertAck(userId) {
  if (typeof window === "undefined" || !userId) return;
  localStorage.removeItem(storageKey(userId));
  window.dispatchEvent(new Event(EVENT));
}
