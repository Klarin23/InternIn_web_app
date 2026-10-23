import { describe, it, expect } from "vitest";
import {
  canAccessSupervision,
  getMemberDashboardKind,
} from "@/lib/navigation/memberPermissions";

// Permissions par défaut (cf. api/src/modules/equipe/equipe.constants.js)
const GESTIONNAIRE_RECRUTEMENT = [
  "offres.gerer",
  "candidats.gerer",
  "entretiens.gerer",
  "talents.voir",
  "talents.proposer",
  "conventions.voir",
  "conventions.gerer",
];
const SUPERVISEUR = [
  "stagiaires.suivre",
  "stagiaires.evaluer",
  "entretiens.gerer",
  "conventions.voir",
];
const LECTURE_SEULE = ["conventions.voir"];

describe("canAccessSupervision (miroir de requireSupervisionAccess)", () => {
  it("refuse le gestionnaire de recrutement par défaut (cause du 403)", () => {
    expect(canAccessSupervision(GESTIONNAIRE_RECRUTEMENT)).toBe(false);
  });

  it("accepte le superviseur", () => {
    expect(canAccessSupervision(SUPERVISEUR)).toBe(true);
  });

  it("refuse la lecture seule", () => {
    expect(canAccessSupervision(LECTURE_SEULE)).toBe(false);
  });

  it("suit les permissions personnalisées, pas le nom du rôle", () => {
    expect(
      canAccessSupervision([...GESTIONNAIRE_RECRUTEMENT, "stagiaires.suivre"]),
    ).toBe(true);
  });

  it("refuse une entrée invalide", () => {
    expect(canAccessSupervision(undefined)).toBe(false);
    expect(canAccessSupervision(null)).toBe(false);
    expect(canAccessSupervision("stagiaires.suivre")).toBe(false);
  });
});

describe("getMemberDashboardKind", () => {
  it("superviseur → tableau de bord supervision", () => {
    expect(getMemberDashboardKind(SUPERVISEUR)).toBe("supervision");
  });

  it("gestionnaire de recrutement → tableau de bord recrutement", () => {
    expect(getMemberDashboardKind(GESTIONNAIRE_RECRUTEMENT)).toBe("recrutement");
  });

  it("lecture seule → recrutement (écran neutre, sans appel /superviseur)", () => {
    expect(getMemberDashboardKind(LECTURE_SEULE)).toBe("recrutement");
  });
});
