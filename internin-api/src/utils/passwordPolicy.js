/**
 * Politique de sécurité des mots de passe InternIn.
 *
 * Règles :
 * - minimum 8 caractères
 * - au moins une majuscule
 * - au moins une minuscule
 * - au moins un chiffre
 * - au moins un caractère spécial
 */

export const PASSWORD_POLICY = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
};

export function isValidPassword(password) {
  if (typeof password !== "string") {
    return false;
  }

  return (
    password.length >= PASSWORD_POLICY.minLength &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

export function getPasswordPolicyErrors(password) {
  const errors = [];

  if (typeof password !== "string" || password.length < 8) {
    errors.push("Le mot de passe doit contenir au moins 8 caractères");
  }

  if (!/[A-Z]/.test(password || "")) {
    errors.push("Le mot de passe doit contenir au moins une majuscule");
  }

  if (!/[a-z]/.test(password || "")) {
    errors.push("Le mot de passe doit contenir au moins une minuscule");
  }

  if (!/[0-9]/.test(password || "")) {
    errors.push("Le mot de passe doit contenir au moins un chiffre");
  }

  if (!/[^A-Za-z0-9]/.test(password || "")) {
    errors.push("Le mot de passe doit contenir au moins un caractère spécial");
  }

  return errors;
}
