import { cpSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CheckResult } from "../tools/check";
import type { Finding } from "../tools/qa/analyze";
import { tempDirs } from "./helpers/tmp";

// The check pass and the renderers are replaced: this file tests what render decides, not the pictures.
const calls = vi.hoisted(() => ({ check: [] as unknown[][], remotion: [] as string[][], ffmpeg: [] as string[][], errors: 0 }));
vi.mock("../tools/check", () => ({
  runCheck: async (...args: unknown[]): Promise<CheckResult> => {
    calls.check.push(args);
    const f = { level: "erreur", check: "coupe", scene: "s", seconds: 1, cause: "coupé par div" } as Finding;
    return { findings: Array.from({ length: calls.errors }, () => f), problems: [], errors: calls.errors, warnings: 0, frames: 1, ms: 1, reportJson: "r.json", reportHtml: "r.html" };
  },
}));
vi.mock("../tools/lib/remotion", () => ({
  runRemotion: (args: string[]) => void calls.remotion.push(args),
  remotionFfmpeg: (args: string[]) => (calls.ffmpeg.push(args), Buffer.alloc(0)),
}));
const { renderVideo } = await import("../tools/render");

const tmp = tempDirs("rushit-render-");
const copy = () => {
  const dir = path.join(tmp(), "video-min");
  cpSync("test/fixtures/video-min", dir, { recursive: true });
  return dir;
};

beforeEach(() => {
  calls.check = [];
  calls.remotion = [];
  calls.ffmpeg = [];
  calls.errors = 0;
});

describe("render, étapes", () => {
  it("refuse dès une seule erreur, sans rien rendre", async () => {
    calls.errors = 1;
    await expect(renderVideo(copy())).rejects.toThrow(/Rendu refusé : 1 erreur\(s\)/);
    expect(calls.remotion).toEqual([]);
  });

  it("--force rend malgré l'erreur et le dit à la passe", async () => {
    calls.errors = 1;
    const dir = copy();
    await renderVideo(dir, { force: true });
    expect(calls.check).toEqual([[dir, { forced: true }]]);
    expect(calls.remotion).toHaveLength(1);
  });

  it("skipCheck rend sans passe de contrôle", async () => {
    calls.errors = 1;
    await renderVideo(copy(), { skipCheck: true });
    expect(calls.check).toEqual([]);
    expect(calls.remotion).toHaveLength(1);
  });

  it("qualité maximale : rendu au double, réduit en lanczos à la taille de video.json", async () => {
    const dir = copy();
    await renderVideo(dir, { quality: "max" });
    expect(calls.remotion).toEqual([["render", "Film", path.join(dir, "out", "video-min.raw4k.mp4"), "--scale", "2"]]);
    expect(calls.ffmpeg[0]).toContain("scale=640:360:flags=lanczos");
    expect(calls.ffmpeg[0]).toContain(path.join(dir, "out", "video-min.raw4k.mp4"));
    // The reduced file is the one the poster and the final video are made from.
    expect(calls.ffmpeg[0].at(-1)).toBe(path.join(dir, "out", "video-min.raw.mp4"));
    expect(calls.ffmpeg[1]).toContain(path.join(dir, "out", "video-min.raw.mp4"));
  });
});
