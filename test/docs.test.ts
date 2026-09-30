import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/** Every text an agent or a person reads: the method sheets, AGENTS.md and README.md. */
const texts = ["AGENTS.md", "README.md", ...readdirSync("method").map((f) => `method/${f}`)];

/** The prose of a Markdown text: code blocks and code spans left out. */
const prose = (md: string) => md.replace(/^```[\s\S]*?^```/gm, "").replace(/`[^`\n]*`/g, "");

describe("documents", () => {
  it("chaque fiche de méthode existe", () => {
    for (let n = 1; n <= 8; n++) expect(existsSync(`method/0${n}-${["demarrer", "scenario", "musique", "theme", "animatique", "scenes", "rendu", "partager"][n - 1]}.md`)).toBe(true);
  });

  it("AGENTS.md nomme les trois arrêts obligatoires", () => {
    const a = readFileSync("AGENTS.md", "utf8");
    expect(a).toMatch(/scénario/);
    expect(a).toMatch(/musique/);
    expect(a).toMatch(/rythme/);
  });

  it("aucun tiret cadratin ni point-virgule entre propositions dans les textes", () => {
    expect(texts.filter((d) => d.startsWith("method/"))).toHaveLength(8);
    for (const d of texts) {
      const text = prose(readFileSync(d, "utf8"));
      expect(text, d).not.toMatch(/—/);
      expect(text, d).not.toMatch(/ ; |; \p{Ll}/u);
    }
  });

  it("CLAUDE.md et GEMINI.md renvoient vers AGENTS.md", () => {
    for (const f of ["CLAUDE.md", "GEMINI.md"]) expect(readFileSync(f, "utf8")).toMatch(/AGENTS\.md/);
  });
});
