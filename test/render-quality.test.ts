import { execFileSync } from "node:child_process";
import { cpSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { remotionBinary } from "../tools/lib/remotion";
import { renderVideo } from "../tools/render";
import { tempDirs } from "./helpers/tmp";

const tmp = tempDirs("rushit-q-");

/** Width and height of the first video stream, read by Remotion's ffprobe. */
const size = (mp4: string) => {
  const { file, env } = remotionBinary("ffprobe");
  const out = execFileSync(file, ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", mp4], { env });
  return out.toString().trim().split(",").map(Number);
};

describe("qualité maximale", () => {
  it("rend au double puis réduit à la taille de la vidéo", async () => {
    const dir = path.join(tmp(), "video-min");
    cpSync("test/fixtures/video-min", dir, { recursive: true });
    const r = await renderVideo(dir, { quality: "max" });
    expect(size(path.join(dir, "out", "video-min.raw4k.mp4"))).toEqual([1280, 720]);
    expect(size(path.join(dir, "out", "video-min.raw.mp4"))).toEqual([640, 360]);
    expect(size(r.mp4)).toEqual([640, 360]);
  }, 600_000);

  it("refuse --scale avec --quality max", async () => {
    await expect(renderVideo("test/fixtures/video-min", { quality: "max", scale: 0.5 })).rejects.toThrow(/exclusi/);
  });
});
