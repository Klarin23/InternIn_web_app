import { describe, it, expect } from "vitest";
import {
  MOTIFS_RETRAIT,
  STATUTS_RETRAIT_AUTORISES,
  peutRetirerCandidature,
  peutChangerStatutCandidature,
} from "@/lib/candidatures/statut";

describe("candidatures/statut", () => {
  describe("MOTIFS_RETRAIT", () => {
    it("expose au moins les motifs métier attendus", () => {
      const codes = MOTIFS_RETRAIT.map((m) => m.code);
      expect(codes).toContain("ACCEPTED_OTHER_OPPORTUNITY");
      expect(codes).toContain("OTHER");
      expect(MOTIFS_RETRAIT.length).toBeGreaterThanOrEqual(5);
    });

    it("chaque motif a un labelKey de traduction", () => {
      for (const m of MOTIFS_RETRAIT) {
        expect(m.labelKey).toMatch(/^candidatures\.withdraw\.reasons\./);
      }
    });
  });

  describe("peutRetirerCandidature", () => {
    it("refuse null / undefined", () => {
      expect(peutRetirerCandidature(null)).toBe(false);
      expect(peutRetirerCandidature(undefined)).toBe(false);
    });

    it.each(STATUTS_RETRAIT_AUTORISES)(
      "autorise le retrait pour statut %s",
      (statut) => {
        expect(peutRetirerCandidature({ statut })).toBe(true);
      },
    );

    it("refuse les statuts terminaux", () => {
      for (const statut of ["acceptee", "refusee", "retiree", "entretien"]) {
        if (STATUTS_RETRAIT_AUTORISES.includes(statut)) continue;
        expect(peutRetirerCandidature({ statut })).toBe(false);
      }
    });
  });
  describe("peutChangerStatutCandidature", () => {
    it("autorise uniquement les transitions métier valides", () => {
      expect(peutChangerStatutCandidature("soumise", "consultee")).toBe(true);
      expect(peutChangerStatutCandidature("soumise", "preselectionnee")).toBe(true);
      expect(peutChangerStatutCandidature("consultee", "rejetee")).toBe(true);
      expect(peutChangerStatutCandidature("preselectionnee", "rejetee")).toBe(true);
    });

    it("bloque les retours en arrière et les statuts terminaux", () => {
      expect(peutChangerStatutCandidature("rejetee", "preselectionnee")).toBe(false);
      expect(peutChangerStatutCandidature("rejetee", "consultee")).toBe(false);
      expect(peutChangerStatutCandidature("preselectionnee", "consultee")).toBe(false);
      expect(peutChangerStatutCandidature("acceptee", "consultee")).toBe(false);
      expect(peutChangerStatutCandidature("retiree", "soumise")).toBe(false);
      expect(peutChangerStatutCandidature("soumise", "soumise")).toBe(false);
    });
  });

});
