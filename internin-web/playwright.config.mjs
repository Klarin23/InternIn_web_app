import { defineConfig, devices } from "@playwright/test";

/**
 * E2E Playwright — flux critiques InternIn.
 * BASE_URL : frontend (défaut localhost:3000)
 * Les tests E2E nécessitent API + DB + frontend démarrés.
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Ne démarre pas automatiquement le serveur : l'équipe lance
  // `npm run dev` (web) + API séparément, ou un script compose.
});
