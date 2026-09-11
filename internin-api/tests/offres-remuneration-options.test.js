import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, it, expect } from "vitest";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schema = readFileSync(path.join(root, "src/db/schema.js"), "utf8");
const service = readFileSync(
  path.join(root, "src/modules/offres/offres.service.js"),
  "utf8",
);

describe("remunerationOptions schema/service regression", () => {
  it("declares remunerationOptions in the Drizzle schema", () => {
    expect(schema).toContain(
      'remunerationOptions: jsonb("remuneration_options")',
    );
  });

  it("groups by remunerationOptions when listing company offers", () => {
    expect(service).toContain("offresStage.remunerationOptions,");
  });
});
