import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { VideoJson } from "../../kit/schema";

export const readVideo = (dir: string): VideoJson => {
  const file = path.join(dir, "video.json");
  const parsed = VideoJson.safeParse(JSON.parse(readFileSync(file, "utf8")));
  if (!parsed.success) throw new Error(`${file} est invalide :\n${parsed.error.message}`);
  return parsed.data;
};

export const writeVideo = (dir: string, v: VideoJson) =>
  writeFileSync(path.join(dir, "video.json"), JSON.stringify(VideoJson.parse(v), null, 2) + "\n");

/** Files video.json declares that the folder does not hold, in declaration order. */
export const checkAssets = (dir: string, v: VideoJson): string[] =>
  [...v.theme.fonts.map((f) => f.file), ...(v.music ? [v.music.file] : [])].filter(
    (rel) => !existsSync(path.join(dir, rel)),
  );
