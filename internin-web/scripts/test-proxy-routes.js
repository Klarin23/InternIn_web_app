/**
 * Test logique proxy — préfixes & rôles (sans serveur Next).
 * node script/test-proxy-routes.js
 */

function matchesPrefix(pathname, prefix) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

const AUTHENTICATED = "AUTHENTICATED";

// Miroir minimal des règles critiques
const ROLE_ROUTES = [
  { prefix: "/offres-entreprise", role: ["entreprise", "membre_entreprise"] },
  { prefix: "/profil-entreprise", role: ["entreprise", "membre_entreprise"] },
  { prefix: "/conventions-entreprise", role: ["entreprise", "membre_entreprise"] },
  { prefix: "/calendrier-supervision", role: "membre_entreprise" },
  { prefix: "/mes-stagiaires", role: "membre_entreprise" },
  { prefix: "/offres", role: "stagiaire" },
  { prefix: "/centre-securite", role: "administrateur" },
  { prefix: "/centre-controle", role: "administrateur" },
  { prefix: "/journal-audit", role: "administrateur" },
  { prefix: "/gestion-stages", role: "administrateur" },
  { prefix: "/gestion-conventions", role: "administrateur" },
  { prefix: "/tableau-de-bord", role: AUTHENTICATED },
  { prefix: "/notifications", role: AUTHENTICATED },
  { prefix: "/onboarding", role: AUTHENTICATED },
  { prefix: "/conventions", role: "universite" },
];

function resolve(pathname) {
  return ROLE_ROUTES.find((r) => matchesPrefix(pathname, r.prefix)) || null;
}

function allowed(pathname, typeUtilisateur) {
  const rule = resolve(pathname);
  if (!rule) return "public-or-unlisted";
  if (!typeUtilisateur) return "deny-no-token";
  if (rule.role === AUTHENTICATED) return "allow";
  const roles = Array.isArray(rule.role) ? rule.role : [rule.role];
  return roles.includes(typeUtilisateur) ? "allow" : "deny-role";
}

let failed = 0;
function assert(name, cond) {
  if (!cond) {
    console.error("FAIL", name);
    failed++;
  } else {
    console.log("OK  ", name);
  }
}

// Sans token
assert("no token profil-entreprise", allowed("/profil-entreprise", null) === "deny-no-token");
assert("no token centre-securite", allowed("/centre-securite", null) === "deny-no-token");
assert("no token calendrier-supervision", allowed("/calendrier-supervision", null) === "deny-no-token");

// Stagiaire
assert("stagiaire /offres", allowed("/offres", "stagiaire") === "allow");
assert("stagiaire /offres-entreprise", allowed("/offres-entreprise", "stagiaire") === "deny-role");
assert("stagiaire /centre-securite", allowed("/centre-securite", "stagiaire") === "deny-role");

// Collision préfixe
assert("offres vs offres-entreprise rule", resolve("/offres-entreprise")?.prefix === "/offres-entreprise");
assert("conventions vs conventions-entreprise", resolve("/conventions-entreprise")?.prefix === "/conventions-entreprise");
assert("conventions univ", resolve("/conventions")?.prefix === "/conventions");

// Entreprise
assert("entreprise profil", allowed("/profil-entreprise", "entreprise") === "allow");
assert("membre conventions-entreprise", allowed("/conventions-entreprise/x", "membre_entreprise") === "allow");
assert("membre calendrier", allowed("/calendrier-supervision", "membre_entreprise") === "allow");
assert("entreprise calendrier (owner-only space?)", allowed("/calendrier-supervision", "entreprise") === "deny-role");

// Admin
assert("admin centre", allowed("/centre-controle", "administrateur") === "allow");
assert("admin journal", allowed("/journal-audit", "administrateur") === "allow");
assert("admin not stagiaire offres", allowed("/offres", "administrateur") === "deny-role");

// Multi
assert("tableau AUTH any", allowed("/tableau-de-bord", "stagiaire") === "allow");
assert("notifications AUTH", allowed("/notifications", "entreprise") === "allow");
assert("onboarding AUTH", allowed("/onboarding/1", "universite") === "allow");

// Public unlisted
assert("connexion unlisted", allowed("/connexion", null) === "public-or-unlisted");
assert("invitation unlisted", allowed("/invitation/abc", null) === "public-or-unlisted");

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log("\nAll proxy route logic checks passed");
