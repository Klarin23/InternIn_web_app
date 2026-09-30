import { describe, expect, it } from "vitest";
import { createOffreSchema, updateOffreSchema } from "../src/modules/offres/offres.schema.js";
import { isOffreDeadlineExpired } from "../src/utils/offreDeadline.js";

const validPayload = {
  titre: "Stage développeur", secteurActivite: "Informatique",
  description: "Description suffisamment longue pour un stage.",
  modeTravail: "hybride", remunerationType: ["aucune"], nombrePostes: 1,
  statut: "brouillon",
};

describe("date et heure limite des offres", () => {
  it("convertit une heure civile Africa/Douala en instant UTC", () => {
    const result = createOffreSchema.safeParse({ ...validPayload, dateLimiteCandidature: "2026-10-10T17:30" });
    expect(result.success).toBe(true);
    expect(result.data.dateLimiteCandidature.toISOString()).toBe("2026-10-10T16:30:00.000Z");
  });

  it("rejette une date calendaire impossible", () => {
    const result = createOffreSchema.safeParse({ ...validPayload, dateLimiteCandidature: "2026-02-31T12:00" });
    expect(result.success).toBe(false);
  });

  it("rejette une date sans heure dans les nouvelles requêtes", () => {
    const result = createOffreSchema.safeParse({ ...validPayload, dateLimiteCandidature: "2026-10-10" });
    expect(result.success).toBe(false);
  });

  it("ne transforme pas une échéance absente en null lors d’une mise à jour partielle", () => {
    const result = updateOffreSchema.safeParse({ titre: "Titre modifié" });
    expect(result.success).toBe(true);
    expect(Object.hasOwn(result.data, "dateLimiteCandidature")).toBe(false);
  });

  it("autorise à effacer une échéance lors d’une mise à jour", () => {
    const result = updateOffreSchema.safeParse({ dateLimiteCandidature: null });
    expect(result.success).toBe(true);
    expect(result.data.dateLimiteCandidature).toBeNull();
  });

  it("accepte une date-heure ISO avec fuseau explicite", () => {
    const result = updateOffreSchema.safeParse({ dateLimiteCandidature: "2026-10-10T16:30:00.000Z" });
    expect(result.success).toBe(true);
    expect(result.data.dateLimiteCandidature.toISOString()).toBe("2026-10-10T16:30:00.000Z");
  });
});

describe("règle serveur d’expiration", () => {
  const now = new Date("2026-10-10T16:30:00.000Z");
  it("garde l’offre ouverte juste avant l’échéance", () => {
    expect(isOffreDeadlineExpired("2026-10-10T16:30:00.001Z", now)).toBe(false);
  });
  it("considère l’offre expirée à l’instant exact de l’échéance", () => {
    expect(isOffreDeadlineExpired("2026-10-10T16:30:00.000Z", now)).toBe(true);
  });
  it("considère une échéance passée comme expirée", () => {
    expect(isOffreDeadlineExpired("2026-10-10T16:29:59.999Z", now)).toBe(true);
  });
  it("n’expire pas une offre sans échéance", () => {
    expect(isOffreDeadlineExpired(null, now)).toBe(false);
  });
});
