import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";

describe("Authentication API", () => {
  it("GET /auth/me refuse une requête sans authentification", async () => {
    const response = await request(app).get("/auth/me");

    expect(response.status).toBe(401);
  });
});
it("POST /auth/login refuse des données invalides", async () => {
  const response = await request(app).post("/auth/login").send({});

  expect(response.status).toBe(400);
});
it("POST /auth/login refuse des identifiants incorrects", async () => {
  const response = await request(app).post("/auth/login").send({
    email: "test-inexistant@internin.test",
    password: "MotDePasseInvalide123!",
  });

  expect([401, 404]).toContain(response.status);
});