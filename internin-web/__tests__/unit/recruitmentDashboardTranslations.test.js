import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { translate } from "@/lib/i18n/useTranslation";
import fr from "@/lib/i18n/locales/fr.json";
import en from "@/lib/i18n/locales/en.json";

function translationKeys(dictionary, prefix = "") {
  return Object.entries(dictionary).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return value && typeof value === "object" && !Array.isArray(value)
      ? [path, ...translationKeys(value, path)]
      : [path];
  });
}

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(js|jsx|ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

describe("parité des catalogues de traduction", () => {
  it("définit les mêmes clés en français et en anglais", () => {
    expect(new Set(translationKeys(en))).toEqual(new Set(translationKeys(fr)));
  });

  it("résout tous les appels t() à clé littérale", () => {
    const keys = new Set([...translationKeys(en), ...translationKeys(fr)]);
    const missing = new Set();
    for (const directory of ["app", "components", "lib"]) {
      for (const file of sourceFiles(join(process.cwd(), directory))) {
        const source = readFileSync(file, "utf8");
        for (const match of source.matchAll(/\bt\(\s*["']([^"']+)["']/g)) {
          if (!keys.has(match[1])) missing.add(`${file}: ${match[1]}`);
        }
      }
    }
    expect([...missing]).toEqual([]);
  });
});

describe("traductions du bouton d'actualisation du dashboard recrutement", () => {
  it("affiche des libellés français", () => {
    expect(translate("recrutementDashboard.refresh", "fr")).toBe("Actualiser");
    expect(translate("recrutementDashboard.refreshing", "fr")).toBe(
      "Actualisation…",
    );
  });

  it("affiche des libellés anglais", () => {
    expect(translate("recrutementDashboard.refresh", "en")).toBe("Refresh");
    expect(translate("recrutementDashboard.refreshing", "en")).toBe(
      "Refreshing…",
    );
  });
});
