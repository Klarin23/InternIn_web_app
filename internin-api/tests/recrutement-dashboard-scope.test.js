import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  context: null,
  select: vi.fn(),
  query: null,
}));

vi.mock("../src/db/index.js", () => ({
  db: { select: h.select },
}));

vi.mock("../src/utils/entrepriseContext.js", () => ({
  resolveEntrepriseContext: vi.fn(async () => h.context),
  hasEntreprisePermission: (context, permission) =>
    context.isProprietaire ||
    context.isAdminPrincipal ||
    context.permissionsEffectives.includes(permission),
}));

import { PgDialect } from "drizzle-orm/pg-core";
import { offresStage } from "../src/db/schema.js";
import { getRecrutementDashboardSection } from "../src/modules/equipe/recrutementDashboard.service.js";

describe("Périmètre entreprise du tableau de bord recrutement", () => {
  beforeEach(() => {
    h.context = null;
    h.query = null;
    h.select.mockReset();
  });

  it("construit chaque requête depuis l'entreprise résolue pour l'utilisateur, jamais depuis un companyId client", async () => {
    const builder = {
      from: vi.fn(),
      where: vi.fn(),
    };
    builder.from.mockReturnValue(builder);
    builder.where.mockImplementation(async (condition) => {
      h.query = new PgDialect().sqlToQuery(condition);
      return [{ total: 4, active: 2 }];
    });
    h.select.mockReturnValue(builder);

    for (const [userId, companyId] of [
      ["user-a", "company-a"],
      ["user-b", "company-b"],
    ]) {
      h.context = {
        entreprise: { idEntreprise: companyId, statutVerification: "verifiee" },
        isProprietaire: false,
        isAdminPrincipal: false,
        permissionsEffectives: ["offres.gerer"],
      };

      const data = await getRecrutementDashboardSection(userId, "offers");

      expect(data).toEqual({ total: 4, active: 2 });
      expect(h.query.sql).toContain('"offres_stage"."id_entreprise"');
      expect(h.query.params).toEqual([companyId]);
    }

    expect(h.select).toHaveBeenCalledTimes(2);
    expect(offresStage.idEntreprise.name).toBe("id_entreprise");
  });
});
