import { cpSync, existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runCheck } from "../tools/check";
import { tempDirs } from "./helpers/tmp";

const tmp = tempDirs("rushit-check-");

const copy = (fixture: string, from = "test/fixtures") => {
  const dir = path.join(tmp(), fixture);
  cpSync(path.join(from, fixture), dir, { recursive: true });
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
    expect(has("marge", "marge")).toBe(true);
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

describe("check sur Carnet", () => {
  it("aucune erreur, un texte lisible partout, et le crédit musical dans la zone sûre", async () => {
    const r = await runCheck(copy("carnet", "examples"));
    expect(r.errors).toBe(0);
    const credit = r.findings.filter((f) => f.element.text.startsWith('"Beauty Flow"'));
    expect(credit.filter((f) => f.check === "petit-texte" || f.check === "marge")).toEqual([]);
    // Every text of the app reads on screen, away from the edge of its window.
    const unreadable = r.findings.filter((f) => f.check === "petit-texte" || f.check === "marge");
    expect(unreadable.map((f) => `${f.scene} ${f.check} ${f.element.text} : ${f.cause}`)).toEqual([]);
  }, 300_000);
});
