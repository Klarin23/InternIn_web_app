/**
 * Miroir des scopes admin (doit rester aligné avec adminRbac.js côté API).
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

/** href (ou préfixe) → scope requis */
export const ADMIN_NAV_SCOPE_BY_HREF = {
  "/tableau-de-bord": ADMIN_SCOPES.DASHBOARD,
  "/gestion-stages": ADMIN_SCOPES.STAGES,
  "/gestion-conventions": ADMIN_SCOPES.CONVENTIONS,
  "/verifications/offres-finales": ADMIN_SCOPES.OFFRES_FINALES,
  "/gestion-entreprises": ADMIN_SCOPES.ENTREPRISES,
  "/gestion-universites": ADMIN_SCOPES.UNIVERSITES,
  "/utilisateurs": ADMIN_SCOPES.UTILISATEURS,
  "/centre-controle": ADMIN_SCOPES.CONTROLE,
  "/centre-securite": ADMIN_SCOPES.SECURITE,
  "/centre-notifications": ADMIN_SCOPES.DASHBOARD, // lecture notifs = tout admin
  "/signalements": ADMIN_SCOPES.UTILISATEURS,
  "/journal-audit": ADMIN_SCOPES.AUDIT,
  "/parametres-admin": ADMIN_SCOPES.PARAMETRES,
};

export function adminCanAccessHref(scopes, href) {
  if (!Array.isArray(scopes) || !scopes.length) return false;
  if (scopes.includes("*")) return true;
  const needed = ADMIN_NAV_SCOPE_BY_HREF[href];
  if (!needed) return true; // entrée non mappée : visible
  return scopes.includes(needed);
}
