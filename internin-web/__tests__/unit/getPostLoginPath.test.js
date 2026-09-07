import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/api/stagiaires", () => ({
  getStagiaireProfileRequest: vi.fn(),
}));

import { getPostLoginPath } from "@/lib/auth/getPostLoginPath";
import { getStagiaireProfileRequest } from "@/lib/api/stagiaires";

describe("getPostLoginPath", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirige vers vérification e-mail si non vérifié", async () => {
    const path = await getPostLoginPath(
      { emailVerifie: false, typeUtilisateur: "stagiaire" },
      "token",
    );
    expect(path).toBe("/verification-email");
  });

  it("redirige vers tableau de bord si compte actif", async () => {
    const path = await getPostLoginPath(
      {
        emailVerifie: true,
        statutCompte: "actif",
        typeUtilisateur: "stagiaire",
      },
      "token",
    );
    expect(path).toBe("/tableau-de-bord");
  });

  it("envoie un stagiaire sans profil vers onboarding", async () => {
    getStagiaireProfileRequest.mockRejectedValueOnce(new Error("404"));
    const path = await getPostLoginPath(
      {
        emailVerifie: true,
        statutCompte: "inactif",
        typeUtilisateur: "stagiaire",
      },
      "token",
    );
    expect(path).toBe("/onboarding/1");
  });

  it("envoie un stagiaire déjà onboardé vers le dashboard", async () => {
    getStagiaireProfileRequest.mockResolvedValueOnce({
      stagiaire: { idStagiaire: "abc", cvUrl: "https://x/cv.pdf" },
    });
    const path = await getPostLoginPath(
      {
        emailVerifie: true,
        statutCompte: "inactif",
        typeUtilisateur: "stagiaire",
      },
      "token",
    );
    expect(path).toBe("/tableau-de-bord");
  });

  it("entreprise inactive → onboarding", async () => {
    const path = await getPostLoginPath(
      {
        emailVerifie: true,
        statutCompte: "inactif",
        typeUtilisateur: "entreprise",
      },
      "token",
    );
    expect(path).toBe("/onboarding/1");
  });
});
