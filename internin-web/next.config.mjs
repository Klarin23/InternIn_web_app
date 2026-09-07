/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== "production";

/**
 * Origines autorisées pour les médias (photos de profil, logos).
 * Les URLs en base sont souvent absolues : http://localhost:4000/uploads/...
 * Sans ces origines, la CSP img-src 'self' bloque l'affichage.
 */
function mediaOrigins() {
  const origins = new Set();
  for (const key of ["NEXT_PUBLIC_API_URL", "API_PUBLIC_URL"]) {
    const raw = process.env[key];
    if (!raw) continue;
    try {
      origins.add(new URL(raw).origin);
    } catch {
      /* ignore invalid URL */
    }
  }
  if (isDev) {
    origins.add("http://localhost:4000");
    origins.add("http://127.0.0.1:4000");
  }
  return [...origins];
}

/**
 * CSP restrictive — domaines uniquement pour les dépendances réelles :
 * - 'self' : app + proxy /api + /uploads (rewrite)
 * - accounts.google.com / apis.google.com : Google Identity (gsi/client)
 * - oauth2.googleapis.com / www.googleapis.com : échange token OAuth navigateur
 * - API backend : photos de profil / logos (URLs absolues stockées en DB)
 *
 * Compromis Next.js :
 * - style-src 'unsafe-inline' : requis par Tailwind / styles runtime Next
 * - script-src 'unsafe-inline' : sans middleware nonce, Next injecte des scripts inline
 * - 'unsafe-eval' : UNIQUEMENT en développement (HMR / React Refresh)
 */
function buildCsp() {
  const scriptSrc = [
    "'self'",
    "https://accounts.google.com",
    "https://apis.google.com",
    "'unsafe-inline'",
  ];
  if (isDev) {
    scriptSrc.push("'unsafe-eval'");
  }

  const connectSrc = [
    "'self'",
    "https://accounts.google.com",
    "https://oauth2.googleapis.com",
    "https://www.googleapis.com",
    ...mediaOrigins(),
  ];
  if (isDev) {
    connectSrc.push("ws:", "wss:");
  }

  const imgSrc = [
    "'self'",
    "data:",
    "blob:",
    "https://lh3.googleusercontent.com",
    ...mediaOrigins(),
  ];

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline' https://accounts.google.com",
    // data:/blob: : prévisualisations upload ; lh3 : avatars Google
    // + origine API : photo_profil / logo stockés en URL absolue
    `img-src ${imgSrc.join(" ")}`,
    "font-src 'self' data:",
    `connect-src ${connectSrc.join(" ")}`,
    "frame-src 'self' blob: https://accounts.google.com https://apis.google.com",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "media-src 'self'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

const nextConfig = {
  reactCompiler: true,

  // Proxy interne : le navigateur appelle /api/... et /uploads/... (même origine)
  // NEXT_PUBLIC_API_URL = URL API backend, sans slash final.
  async rewrites() {
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
    if (!apiUrl) return [];

    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/:path*`,
      },
      // Photos / logos : même origine → img-src 'self' fonctionne aussi
      {
        source: "/uploads/:path*",
        destination: `${apiUrl}/uploads/:path*`,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: buildCsp(),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
