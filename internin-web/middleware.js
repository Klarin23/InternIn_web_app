// Chemin : internin-web/middleware.js

import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

// `role` accepte soit une chaîne, soit un tableau de rôles autorisés — utile
// pour les routes partagées entre plusieurs espaces (ex: /parametres).
const ROLE_ROUTES = [
  { prefix: "/offres-entreprise", role: "entreprise" },
  { prefix: "/entretiens-entreprise", role: "entreprise" },
  { prefix: "/candidats", role: "entreprise" },
  { prefix: "/suivi-stagiaires", role: "entreprise" },
  { prefix: "/equipe", role: "entreprise" },

  { prefix: "/offres", role: "stagiaire" },
  { prefix: "/candidatures", role: "stagiaire" },
  { prefix: "/entretiens", role: "stagiaire" },
  { prefix: "/stage", role: "stagiaire" },
  { prefix: "/profil", role: "stagiaire" },

  { prefix: "/verifications", role: "administrateur" },
  { prefix: "/gestion-entreprises", role: "administrateur" },
  { prefix: "/gestion-universites", role: "administrateur" },
  { prefix: "/utilisateurs", role: "administrateur" },
  { prefix: "/signalements", role: "administrateur" },

  { prefix: "/etudiants-universite", role: "universite" },
  { prefix: "/entreprises-universite", role: "universite" },
  { prefix: "/conventions", role: "universite" },
  { prefix: "/maitres-de-stage", role: "universite" },
  { prefix: "/rapports", role: "universite" },
  { prefix: "/statistiques", role: "universite" },

  {
    prefix: "/parametres",
    role: "stagiaire",
  },
  { prefix: "/parametres-entreprise", role: "entreprise" },
  { prefix: "/parametres-admin", role: "administrateur" },
  { prefix: "/parametres-universite", role: "universite" },
  { prefix: "/partenariats-universites", role: "entreprise" },
  { prefix: "/mes-stagiaires", role: "membre_entreprise" },
];

// Un préfixe ne doit matcher que sur une frontière de segment d'URL, jamais
// en simple préfixe de chaîne : sans ce garde-fou, "/offres" (stagiaire)
// matcherait aussi "/offres-entreprise" (entreprise) selon l'ordre du
// tableau — un bug latent qui ne dépendait que de l'ordre des règles.
function matchesPrefix(pathname, prefix) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

const encodedSecret = new TextEncoder().encode(process.env.JWT_SECRET);

// Vérifie réellement la signature du token (pas un simple décodage base64) :
// un token modifié/forgé ne passera plus cette étape, même si son payload
// contient un typeUtilisateur valide.
async function verifyJwt(token) {
  try {
    const { payload } = await jwtVerify(token, encodedSecret);
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  const rule = ROLE_ROUTES.find((r) => matchesPrefix(pathname, r.prefix));
  if (!rule) return NextResponse.next();

  const token = request.cookies.get("internin_token")?.value;
  if (!token) {
    const url = new URL("/connexion", request.url);
    return NextResponse.redirect(url);
  }

  const payload = await verifyJwt(token);
  const rolesAutorises = Array.isArray(rule.role) ? rule.role : [rule.role];

  if (!payload || !rolesAutorises.includes(payload.typeUtilisateur)) {
    const url = new URL("/connexion", request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/offres-entreprise/:path*",
    "/entretiens-entreprise/:path*",
    "/candidats/:path*",
    "/suivi-stagiaires/:path*",
    "/equipe/:path*",
    "/offres/:path*",
    "/candidatures/:path*",
    "/entretiens/:path*",
    "/stage/:path*",
    "/profil/:path*",
    "/verifications/:path*",
    "/gestion-entreprises/:path*",
    "/gestion-universites/:path*",
    "/utilisateurs/:path*",
    "/signalements/:path*",
    "/etudiants-universite/:path*",
    "/entreprises-universite/:path*",
    "/conventions/:path*",
    "/maitres-de-stage/:path*",
    "/rapports/:path*",
    "/statistiques/:path*",
    "/mes-stagiaires/:path*",
    "/parametres/:path*",
    "/parametres-entreprise/:path*",
    "/parametres-admin/:path*",
    "/parametres-universite/:path*",
    "/partenariats-universites/:path*",
  ],
};
