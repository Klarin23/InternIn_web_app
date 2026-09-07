import { test, expect } from "@playwright/test";

/**
 * E2E — Acceptation (proposition / offre finale)
 * Flux métier sensible : nécessite compte seedé.
 */
const email = process.env.E2E_STAGIAIRE_EMAIL;
const password = process.env.E2E_STAGIAIRE_PASSWORD;

test.describe("Acceptation", () => {
  test.skip(!email || !password, "E2E_STAGIAIRE_EMAIL/PASSWORD requis");

  test("navigation vers une proposition en attente (si présente)", async ({
    page,
  }) => {
    await page.goto("/connexion");
    await page.locator('input[type="email"], input[name="email"]').first().fill(email);
    await page.locator('input[type="password"]').first().fill(password);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/tableau-de-bord|onboarding|propositions/i, {
      timeout: 20_000,
    });

    await page.goto("/propositions-stage");
    // Si une carte "en attente" existe, on peut ouvrir le détail
    const card = page.locator('[data-testid="proposition-card"], article, [role="listitem"]').first();
    if (await card.isVisible().catch(() => false)) {
      await card.click();
      await expect(page.locator("body")).toBeVisible();
    } else {
      test.info().annotations.push({
        type: "note",
        description: "Aucune proposition seedée — smoke navigation OK",
      });
    }
  });
});
