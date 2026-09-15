/**
 * Tests unitaires — garde-fou de sécurité "emailVerifie !== true → activation
 * interdite" (src/utils/emailVerificationGuard.js).
 *
 * Ne nécessitent ni base de données ni token : la logique est pure.
 *
 * npm test -- tests/email-verification-guard.test.js
 */
import { describe, it, expect } from "vitest";
import {
  peutActiverCompte,
  assertEmailVerifiePourActivation,
} from "../src/utils/emailVerificationGuard.js";

describe("peutActiverCompte()", () => {
  it("refuse emailVerifie = false", () => {
    expect(peutActiverCompte(false)).toBe(false);
  });

  it("refuse emailVerifie = null", () => {
    expect(peutActiverCompte(null)).toBe(false);
  });

  it("refuse emailVerifie = undefined", () => {
    expect(peutActiverCompte(undefined)).toBe(false);
  });

  it("refuse toute valeur non strictement égale à true (falsification)", () => {
    // Un utilisateur malveillant pourrait tenter d'envoyer une chaîne ou un
    // nombre plutôt qu'un booléen : seule la valeur true stricte doit passer.
    expect(peutActiverCompte("true")).toBe(false);
    expect(peutActiverCompte(1)).toBe(false);
  });

  it("autorise emailVerifie = true", () => {
    expect(peutActiverCompte(true)).toBe(true);
  });
});

describe("assertEmailVerifiePourActivation()", () => {
  it("lève une erreur 403/EMAIL_NON_VERIFIE si emailVerifie = false", () => {
    try {
      assertEmailVerifiePourActivation(false);
      throw new Error("Ne devait pas arriver ici");
    } catch (err) {
      expect(err.status).toBe(403);
      expect(err.code).toBe("EMAIL_NON_VERIFIE");
    }
  });

  it("lève une erreur 403/EMAIL_NON_VERIFIE si emailVerifie = null", () => {
    try {
      assertEmailVerifiePourActivation(null);
      throw new Error("Ne devait pas arriver ici");
    } catch (err) {
      expect(err.status).toBe(403);
      expect(err.code).toBe("EMAIL_NON_VERIFIE");
    }
  });

  it("lève une erreur 403/EMAIL_NON_VERIFIE si emailVerifie = undefined", () => {
    try {
      assertEmailVerifiePourActivation(undefined);
      throw new Error("Ne devait pas arriver ici");
    } catch (err) {
      expect(err.status).toBe(403);
      expect(err.code).toBe("EMAIL_NON_VERIFIE");
    }
  });

  it("ne lève rien si emailVerifie = true", () => {
    expect(() => assertEmailVerifiePourActivation(true)).not.toThrow();
  });
});
