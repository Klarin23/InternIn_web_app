/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,

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
