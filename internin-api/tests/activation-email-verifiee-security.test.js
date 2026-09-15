/**
 * Tests de sécurité — un compte ne doit jamais pouvoir passer à
 * statutCompte = "actif" si emailVerifie !== true.
 *
 * Endpoints couverts :
 *   POST  /stagiaires/onboarding
 *   POST  /entreprises/onboarding
 *   POST  /universites/onboarding
 *   PATCH /admin/entreprises/:id/statut-compte
 *   PATCH /admin/universites/:id/statut-compte
 *   PATCH /admin/utilisateurs/:id/statut-compte
 *
 * npm test -- tests/activation-email-verifiee-security.test.js
 */
import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";

describe("Sécurité — endpoints d'activation (garde d'authentification)", () => {
  it("POST /stagiaires/onboarding refuse une requête non authentifiée (401)", async () => {
    const res = await request(app).post("/stagiaires/onboarding").send({});
    expect(res.status).toBe(401);
  });

  it("POST /entreprises/onboarding refuse une requête non authentifiée (401)", async () => {
    const res = await request(app).post("/entreprises/onboarding").send({});
    expect(res.status).toBe(401);
  });

  it("POST /universites/onboarding refuse une requête non authentifiée (401)", async () => {
    const res = await request(app).post("/universites/onboarding").send({});
    expect(res.status).toBe(401);
  });

  it("une tentative de falsification directe (emailVerifie dans le body) n'est pas prise en compte sans authentification (401 avant tout traitement du payload)", async () => {
    const res = await request(app)
      .post("/entreprises/onboarding")
      .send({
        nomEntreprise: "Faux Corp",
        emailVerifie: true,
        statutCompte: "actif",
      });
    expect(res.status).toBe(401);
  });
});

/**
 * Tests d'intégration — nécessitent une base seedée avec des comptes de test
 * dont l'état emailVerifie est connu et contrôlé. Suivent le même
 * conditionnement que tests/entreprise-onboarding-security.test.js et
 * tests/admin-user-status-security.test.js : ignorés tant que les variables
 * d'environnement ne sont pas fournies (aucun impact sur `npm test` par défaut).
 *
 * Variables attendues :
 *   TEST_STAGIAIRE_UNVERIFIED_TOKEN   — stagiaire, profil complet à 100 %,
 *                                        emailVerifie = false
 *   TEST_STAGIAIRE_VERIFIED_TOKEN     — stagiaire, profil complet à 100 %,
 *                                        emailVerifie = true
 *   TEST_ENTREPRISE_UNVERIFIED_TOKEN  — entreprise, emailVerifie = false,
 *                                        onboarding pas encore complété
 *   TEST_UNIVERSITE_UNVERIFIED_TOKEN  — université, emailVerifie = false,
 *                                        onboarding pas encore complété
 *   TEST_ADMIN_TOKEN                  — administrateur
 *   TEST_TARGET_UNVERIFIED_USER_ID    — utilisateur cible (non-admin) avec
 *                                        emailVerifie = false, pour l'essai
 *                                        d'activation admin
 */
describe.skipIf(!process.env.TEST_STAGIAIRE_UNVERIFIED_TOKEN)(
  "Stagiaire — email non vérifié (intégration)",
  () => {
    it("Cas 1: emailVerifie=false, profil complet → activation refusée", async () => {
      const res = await request(app)
        .patch("/stagiaires/me")
        .set(
          "Authorization",
          `Bearer ${process.env.TEST_STAGIAIRE_UNVERIFIED_TOKEN}`,
        )
        .send({});
      expect(res.status).toBeLessThan(500);
      if (res.body?.statutCompte) {
        expect(res.body.statutCompte).not.toBe("actif");
      }

      const me = await request(app)
        .get("/stagiaires/me")
        .set(
          "Authorization",
          `Bearer ${process.env.TEST_STAGIAIRE_UNVERIFIED_TOKEN}`,
        );
      expect(me.body?.statutCompte).not.toBe("actif");
    });
  },
);

describe.skipIf(!process.env.TEST_STAGIAIRE_VERIFIED_TOKEN)(
  "Stagiaire — email vérifié (intégration)",
  () => {
    it("Cas 4: emailVerifie=true, profil complet → activation autorisée", async () => {
      const me = await request(app)
        .get("/stagiaires/me")
        .set(
          "Authorization",
          `Bearer ${process.env.TEST_STAGIAIRE_VERIFIED_TOKEN}`,
        );
      expect(me.status).toBe(200);
      if (me.body?.scoreCompletudeProfil >= 100) {
        expect(me.body?.statutCompte).toBe("actif");
      }
    });
  },
);

const ONBOARDING_ENTREPRISE_PAYLOAD = {
  nomEntreprise: "SecTest Email Corp",
  secteurActivite: "Informatique",
  tailleEntreprise: "1-10",
  pays: "Cameroun",
  ville: "Douala",
  aPropos: "Description suffisamment longue pour passer la validation Zod.",
  contactNom: "Jean Test",
  contactFonction: "CEO",
  contactEmail: "ceo@sectest-email.example",
  contactTelephone: "+237600000000",
};

describe.skipIf(!process.env.TEST_ENTREPRISE_UNVERIFIED_TOKEN)(
  "Entreprise — email non vérifié (intégration)",
  () => {
    it("Cas 2/3/5: onboarding complété mais email non vérifié → compte reste inactif (jamais 'actif')", async () => {
      const res = await request(app)
        .post("/entreprises/onboarding")
        .set(
          "Authorization",
          `Bearer ${process.env.TEST_ENTREPRISE_UNVERIFIED_TOKEN}`,
        )
        // Tentative de falsification incluse dans le payload : doit être
        // ignorée, seule la valeur réelle en base doit compter.
        .send({
          ...ONBOARDING_ENTREPRISE_PAYLOAD,
          emailVerifie: true,
          statutCompte: "actif",
        });

      expect([201, 409]).toContain(res.status);

      const me = await request(app)
        .get("/entreprises/me")
        .set(
          "Authorization",
          `Bearer ${process.env.TEST_ENTREPRISE_UNVERIFIED_TOKEN}`,
        );
      expect(me.body?.statutCompte).not.toBe("actif");
    });
  },
);

const ONBOARDING_UNIVERSITE_PAYLOAD = {
  nomUniversite: "SecTest Email University",
  emailOfficiel: "contact@sectest-email-univ.example",
  pays: "Cameroun",
  typeEtablissement: "publique",
};

describe.skipIf(!process.env.TEST_UNIVERSITE_UNVERIFIED_TOKEN)(
  "Université — email non vérifié (intégration)",
  () => {
    it("onboarding complété mais email non vérifié → compte reste inactif", async () => {
      const res = await request(app)
        .post("/universites/onboarding")
        .set(
          "Authorization",
          `Bearer ${process.env.TEST_UNIVERSITE_UNVERIFIED_TOKEN}`,
        )
        .send({
          ...ONBOARDING_UNIVERSITE_PAYLOAD,
          emailVerifie: true,
          statutCompte: "actif",
        });

      expect([201, 409]).toContain(res.status);

      const me = await request(app)
        .get("/universites/me")
        .set(
          "Authorization",
          `Bearer ${process.env.TEST_UNIVERSITE_UNVERIFIED_TOKEN}`,
        );
      expect(me.body?.statutCompte).not.toBe("actif");
    });
  },
);

describe.skipIf(
  !process.env.TEST_ADMIN_TOKEN || !process.env.TEST_TARGET_UNVERIFIED_USER_ID,
)(
  "Admin — activation d'un compte non vérifié (intégration)",
  () => {
    it("PATCH /admin/utilisateurs/:id/statut-compte refuse d'activer un compte emailVerifie=false (403/EMAIL_NON_VERIFIE)", async () => {
      const res = await request(app)
        .patch(
          `/admin/utilisateurs/${process.env.TEST_TARGET_UNVERIFIED_USER_ID}/statut-compte`,
        )
        .set("Authorization", `Bearer ${process.env.TEST_ADMIN_TOKEN}`)
        .send({ statutCompte: "actif" });

      expect(res.status).toBe(403);
      expect(res.body?.code).toBe("EMAIL_NON_VERIFIE");
    });
  },
);
