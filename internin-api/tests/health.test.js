import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";

describe("Health API", () => {
  it("GET /health retourne le statut ok", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "ok",
    });
  });
});
