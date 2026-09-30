import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const docs = ["AGENTS.md", "README.md", ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `method/0${n}`)];

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
    for (const d of ["AGENTS.md", "README.md"]) expect(readFileSync(d, "utf8")).not.toMatch(/—/);
  });

  it("CLAUDE.md et GEMINI.md renvoient vers AGENTS.md", () => {
    for (const f of ["CLAUDE.md", "GEMINI.md"]) expect(readFileSync(f, "utf8")).toMatch(/AGENTS\.md/);
  });
  void docs;
});
