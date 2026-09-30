import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { remotionFfmpegDir } from "../tools/lib/remotion";
import { renderVideo } from "../tools/render";

/** Video frames of a file, counted by the ffprobe Remotion ships. */
const frameCount = (file: string): number => {
  const dir = remotionFfmpegDir();
  const out = execFileSync(
    path.join(dir, "ffprobe"),
    ["-v", "error", "-count_frames", "-select_streams", "v", "-show_entries", "stream=nb_read_frames", "-of", "csv=p=0", file],
    { env: { ...process.env, LD_LIBRARY_PATH: dir, DYLD_LIBRARY_PATH: dir }, encoding: "utf8" },
  );
  return Number(out.trim());
};

describe("renderVideo", () => {
  it("rend la vidéo minimale et son affiche", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "rushit-render-"));
    cpSync("test/fixtures/video-min", dir, { recursive: true });
    const r = renderVideo(dir);
    expect(statSync(r.mp4).size).toBeGreaterThan(1000);
    expect(existsSync(r.poster)).toBe(true);
    // The poster replaces frame 0, it does not add or remove one: 4 s at 30 fps.
    expect(frameCount(r.mp4)).toBe(120);
  }, 300_000);

  it("refuse de rendre quand une police déclarée manque, en la nommant", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "rushit-render-"));
    cpSync("test/fixtures/video-min", dir, { recursive: true });
    const json = path.join(dir, "video.json");
    const v = JSON.parse(readFileSync(json, "utf8"));
    v.theme.fonts = [{ family: "X", file: "assets/fonts/x.woff2", weight: "400" }];
    writeFileSync(json, JSON.stringify(v));
    expect(() => renderVideo(dir)).toThrow(/assets\/fonts\/x\.woff2/);
  });
});
