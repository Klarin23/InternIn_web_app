import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

/**
 * Vitest — tests unitaires / intégration frontend.
 * N'altère pas next.config ni le build production.
 */
export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest/setup.js"],
    include: [
      "**/__tests__/**/*.{test,spec}.{js,jsx}",
      "**/*.{test,spec}.{js,jsx}",
    ],
    exclude: [
      "**/node_modules/**",
      "**/.next/**",
      "**/e2e/**",
      "**/playwright-report/**",
    ],
    css: false,
    // Évite de charger le CSS Tailwind réel dans les tests unitaires
    server: {
      deps: {
        inline: ["next"],
      },
    },
  },
  resolve: {
    alias: {
      "@": root,
    },
  },
});
