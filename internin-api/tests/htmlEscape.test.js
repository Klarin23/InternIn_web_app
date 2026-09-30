/**
 * Tests de la correction de l'injection HTML dans sendInvitationEmail()
 * (internin-api/src/utils/email.js), via l'utilitaire escapeHtml/
 * stripControlChars (internin-api/src/utils/htmlEscape.js).
 *
 * Lance : npm test -- tests/htmlEscape.test.js
 */
import { describe, it, expect } from "vitest";
import { escapeHtml, stripControlChars } from "../src/utils/htmlEscape.js";

describe("escapeHtml", () => {
  it("neutralise le payload d'injection HTML confirmé (faux lien)", () => {
    const payload = '</strong><a href="https://faux-site.com">Cliquez ici</a>';
    const result = escapeHtml(payload);

    // Aucune balise interprétable ne doit subsister dans la sortie.
    expect(result).not.toContain("<a ");
    expect(result).not.toContain("</strong>");
    expect(result).not.toMatch(/<[a-z]/i);

    // La représentation échappée attendue.
    expect(result).toBe(
      "&lt;/strong&gt;&lt;a href=&quot;https://faux-site.com&quot;&gt;Cliquez ici&lt;/a&gt;",
    );
  });

  it("échappe l'esperluette", () => {
    expect(escapeHtml("ACME & Partners")).toBe("ACME &amp; Partners");
  });

  it("échappe les chevrons", () => {
    expect(escapeHtml("Entreprise <test>")).toBe(
      "Entreprise &lt;test&gt;",
    );
  });

  it('échappe les guillemets doubles', () => {
    expect(escapeHtml('Entreprise "Alpha"')).toBe(
      "Entreprise &quot;Alpha&quot;",
    );
  });

  it("échappe les apostrophes", () => {
    expect(escapeHtml("Entreprise 'Beta'")).toBe(
      "Entreprise &#39;Beta&#39;",
    );
  });

  it("laisse un nom d'entreprise normal inchangé (pas de double-échappement)", () => {
    expect(escapeHtml("ACME Cameroun")).toBe("ACME Cameroun");
  });

  it("ne rompt pas sur & suivi d'autres caractères sensibles (ordre d'échappement)", () => {
    // Vérifie qu'on n'échappe pas deux fois le & produit par &lt; etc.
    expect(escapeHtml('<"&\'>')).toBe("&lt;&quot;&amp;&#39;&gt;");
  });

  it("gère null/undefined sans erreur", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
  });

  it("convertit les valeurs non-string avant échappement", () => {
    expect(escapeHtml(42)).toBe("42");
  });
});

describe("stripControlChars", () => {
  it("remplace les retours à la ligne par un espace (protection sujet e-mail)", () => {
    expect(stripControlChars("ACME\r\nBcc: attacker@evil.com")).toBe(
      "ACME Bcc: attacker@evil.com",
    );
  });

  it("laisse un nom normal inchangé", () => {
    expect(stripControlChars("ACME Cameroun")).toBe("ACME Cameroun");
  });

  it("gère null/undefined sans erreur", () => {
    expect(stripControlChars(null)).toBe("");
    expect(stripControlChars(undefined)).toBe("");
  });
});
