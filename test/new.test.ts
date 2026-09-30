import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createVideo, slugify } from "../tools/new";

const root = () => mkdtempSync(path.join(tmpdir(), "rushit-new-"));

describe("slugify", () => {
  it("rend un nom de dossier sûr", () => expect(slugify("Présentation Atelier !")).toBe("presentation-atelier"));
});

describe("createVideo", () => {
  it("crée le dossier avec les règles choisies", async () => {
    const r = await createVideo({ name: "demo", rules: "neutre", root: root() });
    expect(readFileSync(path.join(r.dir, "rules.md"), "utf8")).toMatch(/Règles neutres/);
    expect(existsSync(path.join(r.dir, "video.json"))).toBe(true);
  });

  it("renomme un nom avec espaces et accents, et le signale", async () => {
    const r = await createVideo({ name: "Présentation Atelier", rules: "neutre", root: root() });
    expect(r.name).toBe("presentation-atelier");
    expect(r.renamed).toBe(true);
  });

  it("refuse d'écraser une vidéo existante", async () => {
    const dir = root();
    await createVideo({ name: "demo", rules: "neutre", root: dir });
    await expect(createVideo({ name: "demo", rules: "neutre", root: dir })).rejects.toThrow(/existe déjà/);
  });

  it("refuse --rules miennes quand ~/.rushit/rules.md n'existe pas", async () => {
    const prev = process.env.HOME;
    process.env.HOME = root();
    await expect(createVideo({ name: "demo", rules: "miennes", root: root() })).rejects.toThrow(/rules\.md/);
    process.env.HOME = prev;
  });
});
