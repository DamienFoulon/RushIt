import path from "node:path";
import { fileURLToPath } from "node:url";

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const videosDir = path.join(repoRoot, "videos");
export const videoDir = (name: string) => path.join(videosDir, name);
