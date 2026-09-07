import { test, expect } from "@playwright/test";

/**
 * E2E — Candidature (parcours stagiaire)
 */
const email = process.env.E2E_STAGIAIRE_EMAIL;
const password = process.env.E2E_STAGIAIRE_PASSWORD;

test.describe("Candidature", () => {
  test.skip(!email || !password, "E2E_STAGIAIRE_EMAIL/PASSWORD requis");

  test.beforeEach(async ({ page }) => {
    await page.goto("/connexion");
    await page.locator('input[type="email"], input[name="email"]').first().fill(email);
    await page.locator('input[type="password"]').first().fill(password);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/tableau-de-bord|onboarding|offres/i, {
      timeout: 20_000,
    });
  });

    test("liste des candidatures accessible", async ({ page }) => {
      // Route réelle : app/(stagiaire)/candidatures → /candidatures
      await page.goto("/candidatures");
      await expect(page).toHaveURL(/\/candidatures/i);
      await expect(page.locator("body")).not.toContainText(
        /This page could not be found/i,
      );
      await expect(page.locator("body")).toContainText(
        /candidature|aucune|statut|soumise|offre/i,
      );
    });

  test("catalogue offres accessible", async ({ page }) => {
    await page.goto("/offres");
    await expect(page).toHaveURL(/offres/i);
  });
});
