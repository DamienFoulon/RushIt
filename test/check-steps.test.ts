import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProbeReport, TextFact } from "../kit/qa/types";
import { runCheck } from "../tools/check";
import { tempDirs } from "./helpers/tmp";

// The browser is replaced by a session that answers the same made-up facts on every frame:
// this file tests how check chains its passes, not the measure.
const scenes = ["chevauchement", "coupe", "hors-cadre", "rogne", "couvert", "pale", "petit", "cache", "absent", "contraste", "zone", "propre", "marge"];
const calls = vi.hoisted(() => ({ frames: [] as number[][], dirs: [] as string[] }));
vi.mock("../tools/qa/stills", () => ({
  openSession: async () => ({
    totalFrames: 390, fps: 30, bundleDir: "",
    close: async () => {},
    render: async (frames: readonly number[], outDir: string): Promise<ProbeReport[]> => {
      calls.frames.push([...frames]);
      calls.dirs.push(outDir);
      return frames.map((frame) => {
        writeFileSync(path.join(outDir, `frame-${frame}.png`), "png");
        const scene = scenes[Math.floor(frame / 30)];
        // A small text, outside the column and the stage, in the scene of the frame.
        const text: TextFact = {
          key: `${scene}|p|Petit`, scene, selector: "p", text: "Petit", words: 1, column: false, box: { x: 10, y: 690, w: 20, h: 10 },
          inFrame: 1, opacity: 1, fontPx: 10, bold: false, overflow: false, clippedBy: null, margin: 100, contrast: 12, allowed: [], reasons: [],
        };
        // An expectation of the "rogne" scene, never mounted, seen from every frame.
        const expect = {
          id: "x", scene: "rogne", visible: [100, 110] as [number, number], hidden: null, present: false, box: null, inFrame: 0, shown: 0,
          opacity: 0, clippedBy: null, clippedShare: 0, coveredBy: null, coveredShare: 0, related: [],
        };
        return { frame, width: 1280, height: 720, expects: [expect], texts: [text], overlaps: [] };
      });
    },
  }),
}));

const tmp = tempDirs("rushit-check-steps-");
const copy = () => {
  const dir = path.join(tmp(), "qa-defects");
  cpSync("test/fixtures/qa-defects", dir, { recursive: true });
  return dir;
};

beforeEach(() => {
  calls.frames = [];
  calls.dirs = [];
});

describe("check, enchaînement des passes", () => {
  it("rend ensuite les bornes des attentes, compte les erreurs seules et range les images", async () => {
    const dir = copy();
    const r = await runCheck(dir);
    expect(calls.frames).toHaveLength(2);
    expect(calls.frames[1]).toEqual([100, 110]);
    expect(r.errors).toBe(1);
    expect(r.warnings).toBeGreaterThan(1);
    // The text column only counts in scenes that declare column lines: here, "zone".
    expect([...new Set(r.findings.filter((f) => f.check === "zone").map((f) => f.scene))]).toEqual(["zone"]);
    // The images of the findings are copied next to the report, the working folder is gone.
    expect(existsSync(path.join(dir, "qa", "frames", `frame-${r.findings[0].frame}.png`))).toBe(true);
    expect(calls.dirs.every((d) => !existsSync(d))).toBe(true);
  });

  it("--scene borne la seconde passe et ne garde que la scène, sans les acceptations des autres", async () => {
    const dir = copy();
    mkdirSync(path.join(dir, "qa"));
    const orphan = { id: "0badf00d", check: "marge", scene: "marge", element: "p|Ailleurs", reason: "voulu", date: "2026-09-30" };
    writeFileSync(path.join(dir, "qa", "accepted.json"), JSON.stringify([orphan]));
    const r = await runCheck(dir, { scene: "coupe" });
    // Every bound of the expectation falls outside the scene, on an image already rendered.
    expect(calls.frames[0]).toEqual([30, 33, 45, 56]);
    expect(calls.frames[1]).toEqual([]);
    expect(new Set(r.findings.map((f) => `${f.check} ${f.scene}`))).toEqual(new Set(["petit-texte coupe"]));
    expect(r.errors).toBe(0);
  });
});
