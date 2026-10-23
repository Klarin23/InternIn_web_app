import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { assertRecrutementDashboardAccess } from "../src/modules/equipe/recrutementDashboard.service.js";

function contexte({ statutVerification = "verifiee", permissions = [] } = {}) {
  return {
    entreprise: {
      idEntreprise: "company-a",
      statutVerification,
    },
    isProprietaire: false,
    isAdminPrincipal: false,
    permissionsEffectives: permissions,
  };
}

describe("Accès aux sections du centre de recrutement", () => {
  it("protège la route dashboard contre les requêtes non authentifiées", async () => {
    const response = await request(app).get(
      "/equipe/recrutement/dashboard/applications",
    );

    expect(response.status).toBe(401);
  });

  it("refuse une section inconnue", () => {
    expect(() =>
      assertRecrutementDashboardAccess(contexte(), "unknown"),
    ).toThrowError(
      expect.objectContaining({ status: 400 }),
    );
  });

  it("refuse une section sans permission, sans élargir les droits", () => {
    expect(() =>
      assertRecrutementDashboardAccess(contexte(), "applications"),
    ).toThrowError(
      expect.objectContaining({ status: 403 }),
    );
  });

  it("laisse consulter les offres selon la permission même si l'entreprise attend sa vérification", () => {
    expect(() =>
      assertRecrutementDashboardAccess(
        contexte({
          statutVerification: "en_attente",
          permissions: ["offres.gerer"],
        }),
        "offers",
      ),
    ).not.toThrow();
  });

  it("exige la vérification de l'entreprise pour les candidatures", () => {
    expect(() =>
      assertRecrutementDashboardAccess(
        contexte({
          statutVerification: "en_attente",
          permissions: ["candidats.gerer"],
        }),
        "applications",
      ),
    ).toThrowError(
      expect.objectContaining({
        status: 403,
        code: "ENTREPRISE_NON_VERIFIEE",
      }),
    );
  });

  it("permet à un propriétaire vérifié d'accéder à la section autorisée implicitement", () => {
    expect(() =>
      assertRecrutementDashboardAccess(
        {
          entreprise: {
            idEntreprise: "company-a",
            statutVerification: "verifiee",
          },
          isProprietaire: true,
          isAdminPrincipal: true,
          permissionsEffectives: [],
        },
        "interviews",
      ),
    ).not.toThrow();
  });
});
