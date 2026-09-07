import { test, expect } from "@playwright/test";

/**
 * E2E — Authentication
 * Prérequis : frontend + API démarrés, seed éventuel.
 * Variables optionnelles : E2E_EMAIL, E2E_PASSWORD
 */
test.describe("Authentication", () => {
  test("page login accessible", async ({ page }) => {
    await page.goto("/connexion");
    await expect(page).toHaveURL(/connexion|login|auth/i);
    // Formulaire présent (selectors souples pour i18n)
    const email = page.locator('input[type="email"], input[name="email"]').first();
    const password = page.locator('input[type="password"]').first();
    await expect(email).toBeVisible();
    await expect(password).toBeVisible();
  });

  test("soumission invalide affiche une erreur ou reste sur la page", async ({
    page,
  }) => {
    await page.goto("/connexion");
    const email = page.locator('input[type="email"], input[name="email"]').first();
    const password = page.locator('input[type="password"]').first();
    await email.fill("invalid@example.com");
    await password.fill("wrong-password-xyz");
    await page.locator('button[type="submit"]').first().click();
    // Soit toast/erreur, soit toujours sur connexion
    await page.waitForTimeout(1500);
    const stillAuth = /connexion|login|auth/i.test(page.url());
    const hasError = await page
      .getByText(/incorrect|invalide|erreur|invalid|failed/i)
      .first()
      .isVisible()
      .catch(() => false);
    expect(stillAuth || hasError).toBeTruthy();
  });
});
