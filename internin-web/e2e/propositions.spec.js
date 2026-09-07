import { test, expect } from "@playwright/test";

/**
 * E2E — Propositions (espace stagiaire)
 * Skip automatique si pas de credentials E2E.
 */
const email = process.env.E2E_STAGIAIRE_EMAIL;
const password = process.env.E2E_STAGIAIRE_PASSWORD;

test.describe("Propositions", () => {
  test.skip(!email || !password, "E2E_STAGIAIRE_EMAIL/PASSWORD requis");

  test.beforeEach(async ({ page }) => {
    await page.goto("/connexion");
    await page.locator('input[type="email"], input[name="email"]').first().fill(email);
    await page.locator('input[type="password"]').first().fill(password);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/tableau-de-bord|onboarding|propositions/i, {
      timeout: 20_000,
    });
  });

  test("page propositions accessible après login", async ({ page }) => {
    await page.goto("/propositions-stage");
    await expect(page).toHaveURL(/propositions/i);
    // Hero ou liste ou empty state
    await expect(page.locator("body")).toContainText(/proposition|offre|aucune/i);
  });
});
