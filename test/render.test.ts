import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { repoRoot } from "../tools/lib/paths";
import { remotionEnv, remotionFfmpegDir } from "../tools/lib/remotion";
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
  it("rend la vidéo minimale et son affiche", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "rushit-render-"));
    cpSync("test/fixtures/video-min", dir, { recursive: true });
    const r = await renderVideo(dir);
    expect(statSync(r.mp4).size).toBeGreaterThan(1000);
    expect(existsSync(r.poster)).toBe(true);
    // The poster replaces frame 0, it does not add or remove one: 4 s at 30 fps.
    expect(frameCount(r.mp4)).toBe(120);
  }, 300_000);

  it("refuse de rendre quand une police déclarée manque, en la nommant", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "rushit-render-"));
    cpSync("test/fixtures/video-min", dir, { recursive: true });
    const json = path.join(dir, "video.json");
    const v = JSON.parse(readFileSync(json, "utf8"));
    v.theme.fonts = [{ family: "X", file: "assets/fonts/x.woff2", weight: "400" }];
    writeFileSync(json, JSON.stringify(v));
    await expect(renderVideo(dir)).rejects.toThrow(/assets\/fonts\/x\.woff2/);
  });

  it("arrête le rendu quand une police déclarée est illisible, en la nommant, sans repli silencieux", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "rushit-render-"));
    cpSync("test/fixtures/video-min", dir, { recursive: true });
    writeFileSync(path.join(dir, "assets/fonts/casse.woff2"), Buffer.from("ceci n'est pas une police".repeat(40)));
    const json = path.join(dir, "video.json");
    const v = JSON.parse(readFileSync(json, "utf8"));
    v.theme.fonts = [{ family: "Casse", file: "assets/fonts/casse.woff2", weight: "400" }];
    writeFileSync(json, JSON.stringify(v));
    const r = spawnSync("npx", ["remotion", "still", "Film", path.join(dir, "out.png"), "--frame", "0"], {
      cwd: repoRoot,
      env: remotionEnv(dir),
      encoding: "utf8",
    });
    expect(r.status).not.toBe(0);
    expect(existsSync(path.join(dir, "out.png"))).toBe(false);
    expect(`${r.stdout}${r.stderr}`).toMatch(/Police Casse \(assets\/fonts\/casse\.woff2\) introuvable ou illisible/);
  }, 300_000);
});
