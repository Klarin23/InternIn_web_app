/**
 * RBAC administrateur basé sur roleAdmin (enum existant).
 * super_admin = toutes les scopes.
 */

export const ADMIN_SCOPES = {
  DASHBOARD: "dashboard",
  PARAMETRES: "parametres",
  ENTREPRISES: "entreprises",
  UNIVERSITES: "universites",
  UTILISATEURS: "utilisateurs",
  STAGES: "stages",
  CONVENTIONS: "conventions",
  OFFRES_FINALES: "offres_finales",
  CONTROLE: "controle",
  AUDIT: "audit",
  SECURITE: "securite",
};

/** @type {Record<string, string[]>} */
export const ROLE_ADMIN_SCOPES = {
  super_admin: ["*"],
  operations: [
    ADMIN_SCOPES.DASHBOARD,
    ADMIN_SCOPES.STAGES,
    ADMIN_SCOPES.CONVENTIONS,
    ADMIN_SCOPES.OFFRES_FINALES,
    ADMIN_SCOPES.CONTROLE,
    ADMIN_SCOPES.ENTREPRISES,
    ADMIN_SCOPES.UTILISATEURS,
  ],
  support: [
    ADMIN_SCOPES.DASHBOARD,
    ADMIN_SCOPES.UTILISATEURS,
    ADMIN_SCOPES.SECURITE,
    ADMIN_SCOPES.CONTROLE,
  ],
  relations_entreprises: [
    ADMIN_SCOPES.DASHBOARD,
    ADMIN_SCOPES.ENTREPRISES,
    ADMIN_SCOPES.CONVENTIONS,
    ADMIN_SCOPES.STAGES,
    ADMIN_SCOPES.OFFRES_FINALES,
  ],
  relations_universites: [
    ADMIN_SCOPES.DASHBOARD,
    ADMIN_SCOPES.UNIVERSITES,
    ADMIN_SCOPES.STAGES,
  ],
  conformite: [
    ADMIN_SCOPES.DASHBOARD,
    ADMIN_SCOPES.CONTROLE,
    ADMIN_SCOPES.AUDIT,
    ADMIN_SCOPES.SECURITE,
    ADMIN_SCOPES.CONVENTIONS,
    ADMIN_SCOPES.PARAMETRES,
    ADMIN_SCOPES.ENTREPRISES,
    ADMIN_SCOPES.UNIVERSITES,
    ADMIN_SCOPES.STAGES,
  ],
};

/**
 * @param {string|null|undefined} roleAdmin
 * @param {string} scope
 */
export function adminHasScope(roleAdmin, scope) {
  if (!roleAdmin) return false;
  const scopes = ROLE_ADMIN_SCOPES[roleAdmin];
  if (!scopes) return false;
  if (scopes.includes("*")) return true;
  return scopes.includes(scope);
}

export function listScopesForRole(roleAdmin) {
  if (!roleAdmin) return [];
  const scopes = ROLE_ADMIN_SCOPES[roleAdmin];
  if (!scopes) return [];
  if (scopes.includes("*")) return Object.values(ADMIN_SCOPES);
  return [...scopes];
}
