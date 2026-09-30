import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Finding } from "../tools/qa/analyze";
import { videosDir } from "../tools/lib/paths";

/** A command of the repository, as a user types it. */
const cli = (tool: string, ...args: string[]) => spawnSync("npx", ["tsx", `tools/${tool}.ts`, ...args], { encoding: "utf8" });

describe("npm run check", () => {
  // The command takes a video name: the copy goes in videos/, under a name of its own.
  let dir = "";
  let name = "";
  let run: ReturnType<typeof cli>;
  let coupe: Finding;
  beforeAll(() => {
    mkdirSync(videosDir, { recursive: true });
    dir = mkdtempSync(path.join(videosDir, "qa-defects-"));
    name = path.basename(dir);
    cpSync("test/fixtures/qa-defects", dir, { recursive: true });
    run = cli("check", name, "--scene", "coupe");
    const report = JSON.parse(readFileSync(path.join(dir, "qa/report.json"), "utf8")) as { findings: Finding[] };
    coupe = report.findings.find((f) => f.check === "coupe" && f.level === "erreur")!;
  }, 300_000);
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it("sort en 1 quand il reste une erreur", () => {
    expect(coupe).toBeDefined();
    expect(run.stdout).toMatch(/erreur\(s\)/);
    expect(run.status).toBe(1);
  });

  it("refuse --accept sans --reason, sans rien écrire", () => {
    const r = cli("check", name, "--accept", coupe.id);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/raison est obligatoire/);
    expect(() => readFileSync(path.join(dir, "qa/accepted.json"))).toThrow();
  });

  it("--accept <id> --reason <texte> inscrit le signalement et sort en 0", () => {
    const r = cli("check", name, "--accept", coupe.id, "--reason", "coupe voulue");
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(new RegExp(`Accepté : ${coupe.id}`));
    expect(JSON.parse(readFileSync(path.join(dir, "qa/accepted.json"), "utf8"))).toMatchObject([
      { id: coupe.id, check: "coupe", scene: "coupe", reason: "coupe voulue" },
    ]);
  });
});

describe("npm run render", () => {
  it("refuse une qualité inconnue avant tout rendu, avec un message clair", () => {
    const r = cli("render", "video-min", "--quality", "autre");
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/--quality attend max ou normal, pas « autre »/);
  });
});
