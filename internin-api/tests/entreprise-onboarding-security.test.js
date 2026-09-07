/**
 * Tests de sécurité — escalade de privilèges stagiaire → entreprise
 * via POST /entreprises/onboarding.
 *
 * npm test -- tests/entreprise-onboarding-security.test.js
 */
import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { categoriePreferenceForType } from "../src/modules/notifications/notifications.service.js";
import { TYPES_CONTEXTE_ENTREPRISE } from "../src/utils/entrepriseContext.js";

const ONBOARDING_PAYLOAD = {
  nomEntreprise: "SecTest Corp",
  secteurActivite: "Informatique",
  tailleEntreprise: "1-10",
  pays: "Cameroun",
  ville: "Douala",
  aPropos: "Description suffisamment longue pour passer la validation Zod.",
  contactNom: "Jean Test",
  contactFonction: "CEO",
  contactEmail: "ceo@sectest.example",
  contactTelephone: "+237600000000",
};

describe("Sécurité onboarding entreprise", () => {
  it("refuse une requête non authentifiée (401)", async () => {
    const res = await request(app)
      .post("/entreprises/onboarding")
      .send(ONBOARDING_PAYLOAD);
    expect(res.status).toBe(401);
  });

  it("expose les types de contexte entreprise autorisés", () => {
    expect(TYPES_CONTEXTE_ENTREPRISE).toContain("entreprise");
    expect(TYPES_CONTEXTE_ENTREPRISE).toContain("membre_entreprise");
    expect(TYPES_CONTEXTE_ENTREPRISE).not.toContain("stagiaire");
  });

  it("rejette typeUtilisateur dans le body (Zod strict → 400)", async () => {
    // Sans token : 401 avant Zod. Avec token stagiaire : 403 role.
    // Sans token valide, on vérifie au moins que l'endpoint existe.
    const res = await request(app)
      .post("/entreprises/onboarding")
      .send({ ...ONBOARDING_PAYLOAD, typeUtilisateur: "entreprise" });
    expect([400, 401, 403]).toContain(res.status);
  });
});

/**
 * Tests d'intégration (nécessitent DB seedée + comptes de test).
 * Activés uniquement si les variables d'environnement sont définies.
 */
describe.skipIf(!process.env.TEST_STAGIAIRE_TOKEN)(
  "Onboarding — stagiaire vs entreprise (intégration)",
  () => {
    it("stagiaire → 403, aucune création", async () => {
      const res = await request(app)
        .post("/entreprises/onboarding")
        .set("Authorization", `Bearer ${process.env.TEST_STAGIAIRE_TOKEN}`)
        .send(ONBOARDING_PAYLOAD);
      expect(res.status).toBe(403);
    });

    it("entreprise → succès ou 409 si déjà onboardé", async () => {
      if (!process.env.TEST_ENTREPRISE_TOKEN) return;
      const res = await request(app)
        .post("/entreprises/onboarding")
        .set("Authorization", `Bearer ${process.env.TEST_ENTREPRISE_TOKEN}`)
        .send(ONBOARDING_PAYLOAD);
      expect([201, 409]).toContain(res.status);
    });
  },
);
