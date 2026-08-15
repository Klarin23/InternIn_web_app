/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,

  // Proxy toutes les requêtes /api/* vers l'API Railway.
  // Le navigateur ne voit alors qu'une seule origine (celle du frontend),
  // donc le cookie internin_refresh devient un cookie DE PREMIÈRE PARTIE
  // (first-party) au lieu d'un cookie tiers (third-party) — ce qui évite
  // les blocages de Safari ITP / Firefox ETP / profils Chrome restrictifs,
  // même si le cookie a déjà été configuré correctement en
  // SameSite=None; Secure côté API.
  //
  // BACKEND_URL est une variable serveur (PAS NEXT_PUBLIC_*) : elle n'est
  // jamais exposée au navigateur, la résolution se fait côté serveur Vercel.
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:4000";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/:path*`,
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
          // CSP basique — à ajuster selon tes besoins (analytics, etc.)
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Google Identity Services
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://apis.google.com",
              "style-src 'self' 'unsafe-inline' https://accounts.google.com",
              "img-src 'self' data: blob: http://localhost:4000 https:",
              "font-src 'self' data:",
              // API locale + Google
              "connect-src 'self' http://localhost:4000 https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com https:",
              // Iframe / popup Google
              "frame-src 'self' https://accounts.google.com https://apis.google.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
