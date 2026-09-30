import { cpSync, existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runCheck } from "../tools/check";

const copy = (fixture: string) => {
  const dir = path.join(mkdtempSync(path.join(tmpdir(), "rushit-check-")), fixture);
  cpSync(path.join("test/fixtures", fixture), dir, { recursive: true });
  return dir;
};

describe("check sur la vidéo de défauts", () => {
  it("trouve chaque défaut dans sa scène, et rien sur la scène propre", async () => {
    const dir = copy("qa-defects");
    const r = await runCheck(dir);
    const has = (check: string, scene: string) => r.findings.some((f) => f.check === check && f.scene === scene && f.level !== "accepté");
    expect(has("chevauchement", "chevauchement")).toBe(true);
    expect(has("coupe", "coupe")).toBe(true);
    expect(has("hors-cadre", "hors-cadre")).toBe(true);
    expect(has("attente", "rogne")).toBe(true);
    expect(has("attente", "couvert")).toBe(true);
    expect(has("attente", "pale")).toBe(true);
    expect(has("petit-texte", "petit")).toBe(true);
    expect(has("attente", "cache")).toBe(true);
    expect(has("attente", "absent")).toBe(true);
    expect(has("contraste", "contraste")).toBe(true);
    expect(has("zone", "zone")).toBe(true);
    expect(has("lecture", "zone")).toBe(true);
    expect(r.findings.filter((f) => f.scene === "propre" && f.level !== "accepté")).toEqual([]);
    expect(existsSync(path.join(dir, "qa/report.json"))).toBe(true);
    expect(readFileSync(path.join(dir, "qa/report.html"), "utf8")).toMatch(/chevauchement/);
  }, 300_000);

  it("--scene ne contrôle qu'une scène", async () => {
    const r = await runCheck(copy("qa-defects"), { scene: "coupe" });
    expect(new Set(r.findings.map((f) => f.scene))).toEqual(new Set(["coupe"]));
  }, 300_000);
});

describe("check sur la vidéo propre", () => {
  it("aucune erreur", async () => {
    const r = await runCheck(copy("video-min"));
    expect(r.errors).toBe(0);
  }, 300_000);
});
