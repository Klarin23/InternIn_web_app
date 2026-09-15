/**
 * Tests de sécurité — fuite de motDePasseHash sur les endpoints admin
 * de changement de statut de compte.
 *
 * Endpoints couverts :
 *   PATCH /admin/entreprises/:id/statut-compte
 *   PATCH /admin/universites/:id/statut-compte
 *   PATCH /admin/utilisateurs/:id/statut-compte
 *
 * npm test -- tests/admin-user-status-security.test.js
 */
import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { sanitizeUser } from "../src/modules/auth/auth.service.js";

describe("Sécurité — sanitizeUser()", () => {
  it("retire motDePasseHash et conserve les autres champs", () => {
    const brut = {
      idUtilisateur: "abc-123",
      email: "test@internin.test",
      motDePasseHash: "$2b$10$hashfictifpourletest",
      typeUtilisateur: "stagiaire",
      statutCompte: "actif",
    };

    const safe = sanitizeUser(brut);

    expect(safe).not.toHaveProperty("motDePasseHash");
    expect(safe.idUtilisateur).toBe("abc-123");
    expect(safe.email).toBe("test@internin.test");
    expect(safe.typeUtilisateur).toBe("stagiaire");
    expect(safe.statutCompte).toBe("actif");
  });

  it("ne plante pas si l'utilisateur est null/undefined", () => {
    expect(sanitizeUser(null)).toBe(null);
    expect(sanitizeUser(undefined)).toBe(undefined);
  });
});

describe("Sécurité — endpoints admin statut-compte (garde d'authentification)", () => {
  it("PATCH /admin/entreprises/:id/statut-compte refuse une requête non authentifiée (401)", async () => {
    const res = await request(app)
      .patch("/admin/entreprises/00000000-0000-0000-0000-000000000000/statut-compte")
      .send({ statutCompte: "suspendu" });
    expect(res.status).toBe(401);
  });

  it("PATCH /admin/universites/:id/statut-compte refuse une requête non authentifiée (401)", async () => {
    const res = await request(app)
      .patch("/admin/universites/00000000-0000-0000-0000-000000000000/statut-compte")
      .send({ statutCompte: "suspendu" });
    expect(res.status).toBe(401);
  });

  it("PATCH /admin/utilisateurs/:id/statut-compte refuse une requête non authentifiée (401)", async () => {
    const res = await request(app)
      .patch("/admin/utilisateurs/00000000-0000-0000-0000-000000000000/statut-compte")
      .send({ statutCompte: "suspendu" });
    expect(res.status).toBe(401);
  });
});

/**
 * Tests d'intégration — nécessitent une base seedée + un token admin valide
 * (TEST_ADMIN_TOKEN) et un utilisateur cible non-admin (TEST_TARGET_USER_ID,
 * TEST_TARGET_ENTREPRISE_ID, TEST_TARGET_UNIVERSITE_ID). Suivent le même
 * conditionnement que tests/entreprise-onboarding-security.test.js.
 */
describe.skipIf(!process.env.TEST_ADMIN_TOKEN)(
  "Endpoints admin statut-compte — réponse ne contient jamais motDePasseHash (intégration)",
  () => {
    it("PATCH .../utilisateurs/:id/statut-compte ne renvoie pas motDePasseHash", async () => {
      if (!process.env.TEST_TARGET_USER_ID) return;
      const res = await request(app)
        .patch(`/admin/utilisateurs/${process.env.TEST_TARGET_USER_ID}/statut-compte`)
        .set("Authorization", `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .send({ statutCompte: "actif" });

      expect(res.status).toBe(200);
      expect(res.body.utilisateur).not.toHaveProperty("motDePasseHash");
      // Les autres champs attendus par le frontend restent bien présents.
      expect(res.body.utilisateur).toHaveProperty("idUtilisateur");
      expect(res.body.utilisateur).toHaveProperty("statutCompte", "actif");
    });

    it("PATCH .../entreprises/:id/statut-compte ne renvoie pas motDePasseHash", async () => {
      if (!process.env.TEST_TARGET_ENTREPRISE_ID) return;
      const res = await request(app)
        .patch(`/admin/entreprises/${process.env.TEST_TARGET_ENTREPRISE_ID}/statut-compte`)
        .set("Authorization", `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .send({ statutCompte: "actif" });

      expect(res.status).toBe(200);
      expect(res.body.utilisateur).not.toHaveProperty("motDePasseHash");
      expect(res.body.utilisateur).toHaveProperty("statutCompte", "actif");
    });

    it("PATCH .../universites/:id/statut-compte ne renvoie pas motDePasseHash", async () => {
      if (!process.env.TEST_TARGET_UNIVERSITE_ID) return;
      const res = await request(app)
        .patch(`/admin/universites/${process.env.TEST_TARGET_UNIVERSITE_ID}/statut-compte`)
        .set("Authorization", `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .send({ statutCompte: "actif" });

      expect(res.status).toBe(200);
      expect(res.body.utilisateur).not.toHaveProperty("motDePasseHash");
      expect(res.body.utilisateur).toHaveProperty("statutCompte", "actif");
    });

    it("GET /admin/utilisateurs (liste) ne renvoie jamais motDePasseHash", async () => {
      const res = await request(app)
        .get("/admin/utilisateurs")
        .set("Authorization", `Bearer ${process.env.TEST_ADMIN_TOKEN}`);

      expect(res.status).toBe(200);
      const liste = Array.isArray(res.body) ? res.body : res.body.utilisateurs || [];
      for (const u of liste) {
        expect(u).not.toHaveProperty("motDePasseHash");
      }
    });

    it("GET /admin/utilisateurs/:id (détail) ne renvoie jamais motDePasseHash", async () => {
      if (!process.env.TEST_TARGET_USER_ID) return;
      const res = await request(app)
        .get(`/admin/utilisateurs/${process.env.TEST_TARGET_USER_ID}`)
        .set("Authorization", `Bearer ${process.env.TEST_ADMIN_TOKEN}`);

      expect(res.status).toBe(200);
      expect(JSON.stringify(res.body)).not.toContain("motDePasseHash");
    });
  },
);
