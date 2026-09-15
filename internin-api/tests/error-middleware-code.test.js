/**
 * Test unitaire — le gestionnaire d'erreurs global doit transmettre
 * err.code dans la réponse JSON quand il est présent (nécessaire pour que
 * le frontend puisse distinguer EMAIL_NON_VERIFIE des autres erreurs 403),
 * sans changer le format existant pour les erreurs qui n'en ont pas.
 *
 * npm test -- tests/error-middleware-code.test.js
 */
import { describe, it, expect, vi } from "vitest";
import { errorHandler } from "../src/middlewares/error.middleware.js";

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.set = vi.fn().mockReturnValue(res);
  return res;
}

describe("errorHandler()", () => {
  it("transmet err.code quand il est présent sur une erreur 4xx", () => {
    const res = mockRes();
    const err = new Error("Impossible d'activer ce compte");
    err.status = 403;
    err.code = "EMAIL_NON_VERIFIE";

    errorHandler(err, { path: "/x", method: "GET" }, res, () => {});

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: "Impossible d'activer ce compte",
      code: "EMAIL_NON_VERIFIE",
    });
  });

  it("n'ajoute pas de champ code quand il est absent (comportement existant)", () => {
    const res = mockRes();
    const err = new Error("Utilisateur introuvable");
    err.status = 404;

    errorHandler(err, { path: "/x", method: "GET" }, res, () => {});

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Utilisateur introuvable" });
  });

  it("masque le message et ne transmet pas code pour une erreur 5xx", () => {
    const res = mockRes();
    const err = new Error("Détail interne sensible");
    err.status = 500;
    err.code = "INTERNAL_DETAIL";

    errorHandler(err, { path: "/x", method: "GET" }, res, () => {});

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Erreur interne du serveur" });
  });
});
