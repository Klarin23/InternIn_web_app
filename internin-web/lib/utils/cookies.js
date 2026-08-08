// Utilitaires minimalistes pour lire/écrire des cookies côté client.
// On évite une dépendance externe (js-cookie) pour un besoin aussi simple.

export function setCookie(name, value, days = 7) {
  const maxAge = days * 24 * 60 * 60;

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
