import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { eq } from "drizzle-orm";
import app from "../src/app.js";
import { db } from "../src/db/index.js";
import { utilisateurs, verificationsEmail, sessionsUtilisateur } from "../src/db/schema.js";
import { hashPassword, comparePassword } from "../src/utils/password.js";

const { sendPasswordResetEmail } = vi.hoisted(() => ({
  sendPasswordResetEmail: vi.fn(),
}));

vi.mock("../src/utils/email.js", () => ({
  sendVerificationEmail: vi.fn(),
  sendPasswordResetEmail,
}));

const email = `password-reset-${crypto.randomUUID()}@internin.test`;
let userId;

describe("Password reset flow", () => {
  beforeAll(async () => {
    const [user] = await db
      .insert(utilisateurs)
      .values({
        email,
        motDePasseHash: await hashPassword("OldPassword123!"),
        typeUtilisateur: "stagiaire",
      })
      .returning({ idUtilisateur: utilisateurs.idUtilisateur });
    userId = user.idUtilisateur;
  });

  afterAll(async () => {
    if (!userId) return;
    await db
      .delete(verificationsEmail)
      .where(eq(verificationsEmail.idUtilisateur, userId));
    await db
      .delete(sessionsUtilisateur)
      .where(eq(sessionsUtilisateur.idUtilisateur, userId));
    await db.delete(utilisateurs).where(eq(utilisateurs.idUtilisateur, userId));
  });

  it("réinitialise le mot de passe avec le lien qui vient d'être émis", async () => {
    const forgotResponse = await request(app)
      .post("/auth/mot-de-passe-oublie")
      .send({ email });

    expect(forgotResponse.status).toBe(200);
    expect(sendPasswordResetEmail).toHaveBeenCalledOnce();

    const [{ token }] = sendPasswordResetEmail.mock.calls[0];
    expect(token).toMatch(/^[a-f0-9]{64}$/);

    const resetResponse = await request(app)
      .post("/auth/reinitialiser-mot-de-passe")
      .send({ token, password: "NewPassword123!" });

    expect(resetResponse.status).toBe(200);
    expect(
      await comparePassword(
        "NewPassword123!",
        (
          await db
            .select({ motDePasseHash: utilisateurs.motDePasseHash })
            .from(utilisateurs)
            .where(eq(utilisateurs.idUtilisateur, userId))
            .limit(1)
        )[0].motDePasseHash,
      ),
    ).toBe(true);

    const reusedResponse = await request(app)
      .post("/auth/reinitialiser-mot-de-passe")
      .send({ token, password: "AnotherPassword123!" });
    expect(reusedResponse.status).toBe(400);
  });
});
