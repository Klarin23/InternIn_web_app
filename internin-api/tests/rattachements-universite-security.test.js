import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";

describe("Sécurité rattachement étudiant ↔ université", () => {
  it("refuse l'invitation universitaire sans authentification", async () => {
    const res = await request(app)
      .post("/rattachements-universite/universites/moi/invitations")
      .send({ email: "student@example.com" });
    expect(res.status).toBe(401);
  });

  it("refuse l'acceptation d'une invitation sans authentification", async () => {
    const res = await request(app).post(
      "/rattachements-universite/invitations/invalid-token-aaaaaaaaaaaaaaaaaaaaaaaaaaaa/accepter",
    );
    expect(res.status).toBe(401);
  });

  it("refuse le code de rattachement sans authentification", async () => {
    const res = await request(app)
      .post("/rattachements-universite/stagiaires/moi/rattachement/code")
      .send({ code: "IN-INVALID" });
    expect(res.status).toBe(401);
  });

  it("refuse la confirmation d'une demande sans authentification", async () => {
    const res = await request(app).post(
      "/rattachements-universite/universites/moi/demandes/not-a-uuid/confirmer",
    );
    expect(res.status).toBe(401);
  });

  it.skipIf(!process.env.DATABASE_URL)(
    "refuse une invitation avec un token manifestement trop court",
    async () => {
      const res = await request(app).get(
        "/rattachements-universite/invitations/short",
      );
      expect(res.status).toBe(404);
    },
  );
});
