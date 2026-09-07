/**
 * Tests des préférences de notifications entreprise.
 * Nécessite une base de test configurée (même setup que auth.test.js).
 * Lance : npm test -- tests/entreprise-notif-prefs.test.js
 */
import { describe, it, expect } from "vitest";
import {
  DEFAULT_ENTREPRISE_NOTIF_PREFS,
  categoriePreferenceForType,
  shouldSendEntrepriseNotification,
  getEntrepriseNotifPrefs,
  updateEntrepriseNotifPrefs,
  creerNotification,
} from "../src/modules/notifications/notifications.service.js";

describe("categoriePreferenceForType", () => {
  it("mappe les candidatures", () => {
    expect(categoriePreferenceForType("candidature_recue")).toBe("candidatures");
    expect(categoriePreferenceForType("candidature_retiree")).toBe("candidatures");
  });
  it("mappe les évaluations", () => {
    expect(categoriePreferenceForType("rappel_evaluation_stage")).toBe(
      "evaluations",
    );
  });
  it("retourne null pour types non configurables", () => {
    expect(categoriePreferenceForType("offre_finale_approuvee")).toBe(null);
  });
});

describe("DEFAULT_ENTREPRISE_NOTIF_PREFS", () => {
  it("active toutes les catégories par défaut", () => {
    expect(DEFAULT_ENTREPRISE_NOTIF_PREFS).toEqual({
      messages: true,
      candidatures: true,
      evaluations: true,
      equipe: true,
    });
  });
});

// Les tests d'intégration BDD (get/update/shouldSend) dépendent d'un idEntreprise
// réel — à activer dans un environnement de test seedé.
describe.skip("persistance (intégration)", () => {
  const idEntreprise = process.env.TEST_ID_ENTREPRISE;
  it("retourne les défauts si aucune ligne", async () => {
    const prefs = await getEntrepriseNotifPrefs(idEntreprise);
    expect(prefs.candidatures).toBe(true);
  });
  it("sauvegarde un patch", async () => {
    const prefs = await updateEntrepriseNotifPrefs(idEntreprise, {
      candidatures: false,
    });
    expect(prefs.candidatures).toBe(false);
    expect(await shouldSendEntrepriseNotification(idEntreprise, "candidatures")).toBe(
      false,
    );
  });
  it("bloque creerNotification si catégorie désactivée", async () => {
    await updateEntrepriseNotifPrefs(idEntreprise, { candidatures: false });
    const notif = await creerNotification({
      idUtilisateur: process.env.TEST_ID_UTILISATEUR,
      type: "candidature_recue",
      titre: "Test",
      message: "Test",
      idEntreprise,
      categoriePreference: "candidatures",
    });
    expect(notif).toBeNull();
  });
});
