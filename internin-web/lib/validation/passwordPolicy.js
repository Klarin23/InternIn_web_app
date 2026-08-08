export const PASSWORD_POLICY = {
  minLength: 8,
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  number: /[0-9]/,
  special: /[^A-Za-z0-9]/,
};

export function getPasswordRequirements(password = "") {
  return {
    minLength: password.length >= PASSWORD_POLICY.minLength,

    uppercase: PASSWORD_POLICY.uppercase.test(password),

    lowercase: PASSWORD_POLICY.lowercase.test(password),

    number: PASSWORD_POLICY.number.test(password),

    special: PASSWORD_POLICY.special.test(password),
  };
}

export function isStrongPassword(password = "") {
  const requirements = getPasswordRequirements(password);

  return Object.values(requirements).every(Boolean);
}
