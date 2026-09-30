import { cpSync, existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { renderVideo } from "../tools/render";

const copy = (fixture: string) => {
  const dir = path.join(mkdtempSync(path.join(tmpdir(), "rushit-gate-")), fixture);
  cpSync(path.join("test/fixtures", fixture), dir, { recursive: true });
  return dir;
};

describe("verrou de rendu", () => {
  it("refuse une vidéo avec une erreur, en résumant", async () => {
    await expect(renderVideo(copy("qa-defects"))).rejects.toThrow(/erreur/);
  }, 600_000);

  it("rend avec --force et le note dans le rapport", async () => {
    const dir = copy("qa-defects");
    const r = await renderVideo(dir, { force: true, scale: 0.25 });
    expect(existsSync(r.mp4)).toBe(true);
    expect(JSON.parse(readFileSync(path.join(dir, "qa/report.json"), "utf8")).forced).toBe(true);
  }, 600_000);

  it("rend une vidéo propre sans rien forcer", async () => {
    const r = await renderVideo(copy("video-min"));
    expect(existsSync(r.mp4)).toBe(true);
  }, 600_000);
});
