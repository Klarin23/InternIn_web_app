// Utilitaires minimalistes pour lire/écrire des cookies côté client.
// On évite une dépendance externe (js-cookie) pour un besoin aussi simple.

// `maxAgeSeconds` permet de fixer une durée précise (en secondes) plutôt
// qu'en jours, sans casser les appels existants qui utilisent `days`.
// Utile pour un cookie censé refléter la durée de vie d'un token (ex: le
// JWT d'accès expire en 15 min côté API — inutile de garder son cookie
// 7 jours de plus, ça ne fait qu'allonger la fenêtre pendant laquelle une
// copie du cookie resterait présente dans le navigateur).
export function setCookie(name, value, days = 7, maxAgeSeconds) {
  const maxAge =
    typeof maxAgeSeconds === "number" ? maxAgeSeconds : days * 24 * 60 * 60;

  // En production on force Secure. En local (http) on le retire pour que ça marche.
  const isSecure =
    typeof window !== "undefined" && window.location.protocol === "https:";

  let cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Strict`;

  if (isSecure) {
    cookie += "; Secure";
  }

  document.cookie = cookie;
}

export function deleteCookie(name) {
  // On met max-age=0 + les mêmes flags pour être sûr que le navigateur le supprime
  const isSecure =
    typeof window !== "undefined" && window.location.protocol === "https:";

  let cookie = `${name}=; path=/; max-age=0; SameSite=Strict`;
  if (isSecure) {
    cookie += "; Secure";
  }

  document.cookie = cookie;
}
