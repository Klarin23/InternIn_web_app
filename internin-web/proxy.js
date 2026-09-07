// Chemin : internin-web/proxy.js
//
// Protection d'espace (premier filet) : le proxy ne décide PAS de l'état
// d'un compte. La suspension, la révocation et le rôle courant sont autorisés
// par l'API backend, qui consulte PostgreSQL via /auth/me.
//
// Le proxy ne fait qu'un contrôle précoce pour éviter de servir une page
// protégée à un navigateur dont le JWT est déjà invalide/suspendu/révoqué.

import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const AUTHENTICATED = "AUTHENTICATED";

const ROLE_ROUTES = [
  { prefix: "/offres-entreprise", role: ["entreprise", "membre_entreprise"] },
  { prefix: "/entretiens-entreprise", role: ["entreprise", "membre_entreprise"] },
  { prefix: "/candidats", role: ["entreprise", "membre_entreprise"] },
  { prefix: "/talents", role: ["entreprise", "membre_entreprise"] },
  { prefix: "/suivi-stagiaires", role: ["entreprise", "membre_entreprise"] },
  { prefix: "/equipe", role: ["entreprise", "membre_entreprise"] },
  { prefix: "/profil-entreprise", role: ["entreprise", "membre_entreprise"] },
  { prefix: "/conventions-entreprise", role: ["entreprise", "membre_entreprise"] },
  { prefix: "/parametres-entreprise", role: ["entreprise", "membre_entreprise"] },
  { prefix: "/partenariats-universites", role: ["entreprise", "membre_entreprise"] },
  { prefix: "/messages-entreprise", role: ["entreprise", "membre_entreprise"] },
  { prefix: "/supervision", role: ["entreprise", "membre_entreprise"] },
  { prefix: "/calendrier-supervision", role: "membre_entreprise" },
  { prefix: "/mes-stagiaires", role: "membre_entreprise" },
  { prefix: "/offres", role: "stagiaire" },
  { prefix: "/candidatures", role: "stagiaire" },
  { prefix: "/entretiens", role: "stagiaire" },
  { prefix: "/stage", role: "stagiaire" },
  { prefix: "/certificats", role: "stagiaire" },
  { prefix: "/profil", role: "stagiaire" },
  { prefix: "/convention", role: "stagiaire" },
  { prefix: "/favoris", role: "stagiaire" },
  { prefix: "/propositions-stage", role: "stagiaire" },
  { prefix: "/securite", role: "stagiaire" },
  { prefix: "/messages", role: "stagiaire" },
  { prefix: "/parametres", role: "stagiaire" },
  { prefix: "/verifications", role: "administrateur" },
  { prefix: "/gestion-entreprises", role: "administrateur" },
  { prefix: "/gestion-universites", role: "administrateur" },
  { prefix: "/gestion-stages", role: "administrateur" },
  { prefix: "/gestion-conventions", role: "administrateur" },
  { prefix: "/utilisateurs", role: "administrateur" },
  { prefix: "/signalements", role: "administrateur" },
  { prefix: "/centre-controle", role: "administrateur" },
  { prefix: "/centre-notifications", role: "administrateur" },
  { prefix: "/centre-securite", role: "administrateur" },
  { prefix: "/journal-audit", role: "administrateur" },
  { prefix: "/parametres-admin", role: "administrateur" },
  { prefix: "/etudiants-universite", role: "universite" },
  { prefix: "/entreprises-universite", role: "universite" },
  { prefix: "/conventions", role: "universite" },
  { prefix: "/maitres-de-stage", role: "universite" },
  { prefix: "/rapports", role: "universite" },
  { prefix: "/statistiques", role: "universite" },
  { prefix: "/parametres-universite", role: "universite" },
  { prefix: "/tableau-de-bord", role: AUTHENTICATED },
  { prefix: "/notifications", role: AUTHENTICATED },
  { prefix: "/onboarding", role: AUTHENTICATED },
];

function matchesPrefix(pathname, prefix) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

const encodedSecret = new TextEncoder().encode(process.env.JWT_SECRET || "");

async function verifyJwtSignature(token) {
  if (!process.env.JWT_SECRET) return null;
  try {
    const { payload } = await jwtVerify(token, encodedSecret);
    return payload;
  } catch {
    return null;
  }
}

function getBackendAuthUrl(request) {
  const configured = process.env.NEXT_PUBLIC_API_URL || process.env.API_PUBLIC_URL;
  if (configured) return `${configured.replace(/\/$/, "")}/auth/me`;

  // Fallback local uniquement. En production, l'absence d'URL backend doit
  // faire échouer le contrôle plutôt que de considérer le JWT comme autorité.
  if (process.env.NODE_ENV !== "production") {
    return `${new URL(request.url).protocol}//localhost:4000/auth/me`;
  }
  return null;
}

async function getAuthoritativeUser(request, token) {
  const url = getBackendAuthUrl(request);
  if (!url) return { ok: false, reason: "backend_not_configured" };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: controller.signal,
    });

    if (response.status === 401) return { ok: false, reason: "invalid_or_revoked" };
    if (response.status === 403) return { ok: false, reason: "suspended" };
    if (!response.ok) return { ok: false, reason: "backend_error" };

    const data = await response.json();
    const user = data?.user;
    if (!user?.idUtilisateur || !user?.typeUtilisateur) {
      return { ok: false, reason: "invalid_backend_identity" };
    }

    return { ok: true, user };
  } catch {
    return { ok: false, reason: "backend_unreachable" };
  } finally {
    clearTimeout(timeout);
  }
}

function redirectConnexion(request, reason) {
  const url = new URL("/connexion", request.url);
  if (request.nextUrl?.pathname) {
    url.searchParams.set("next", request.nextUrl.pathname);
  }
  if (reason === "suspended") url.searchParams.set("reason", "suspended");
  return NextResponse.redirect(url);
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const rule = ROLE_ROUTES.find((r) => matchesPrefix(pathname, r.prefix));
  if (!rule) return NextResponse.next();

  const token = request.cookies.get("internin_token")?.value;
  if (!token) return redirectConnexion(request, "missing_token");

  // Vérification cryptographique locale = optimisation / premier filet.
  // Elle ne suffit volontairement PAS à autoriser la session.
  const payload = await verifyJwtSignature(token);
  if (!payload?.idUtilisateur) {
    return redirectConnexion(request, "invalid_token");
  }

  // Autorité réelle : API backend -> requireAuth -> PostgreSQL.
  // Cela vérifie notamment statutCompte et versionJeton à CHAQUE requête.
  const authority = await getAuthoritativeUser(request, token);
  if (!authority.ok) {
    return redirectConnexion(request, authority.reason);
  }

  const role = authority.user.typeUtilisateur;
  if (rule.role === AUTHENTICATED) return NextResponse.next();

  const rolesAutorises = Array.isArray(rule.role) ? rule.role : [rule.role];
  if (!rolesAutorises.includes(role)) {
    return redirectConnexion(request, "role_forbidden");
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/offres-entreprise/:path*", "/entretiens-entreprise/:path*", "/candidats/:path*",
    "/talents/:path*", "/suivi-stagiaires/:path*", "/equipe/:path*", "/profil-entreprise/:path*",
    "/conventions-entreprise/:path*", "/parametres-entreprise/:path*", "/partenariats-universites/:path*",
    "/messages-entreprise/:path*", "/supervision/:path*", "/calendrier-supervision/:path*", "/mes-stagiaires/:path*",
    "/offres/:path*", "/candidatures/:path*", "/entretiens/:path*", "/stage/:path*", "/certificats/:path*",
    "/profil/:path*", "/convention/:path*", "/favoris/:path*", "/propositions-stage/:path*", "/securite/:path*",
    "/messages/:path*", "/parametres/:path*", "/verifications/:path*", "/gestion-entreprises/:path*",
    "/gestion-universites/:path*", "/gestion-stages/:path*", "/gestion-conventions/:path*", "/utilisateurs/:path*",
    "/signalements/:path*", "/centre-controle/:path*", "/centre-notifications/:path*", "/centre-securite/:path*",
    "/journal-audit/:path*", "/parametres-admin/:path*", "/etudiants-universite/:path*", "/entreprises-universite/:path*",
    "/conventions/:path*", "/maitres-de-stage/:path*", "/rapports/:path*", "/statistiques/:path*", "/parametres-universite/:path*",
    "/tableau-de-bord/:path*", "/notifications/:path*", "/onboarding/:path*",
  ],
};
