import path from "node:path";
import { fileURLToPath } from "node:url";

// The Remotion CLI evaluates remotion.config.ts as CommonJS, where import.meta
// is empty, after changing into the repository: there, the working directory is the root.
const metaUrl: unknown = import.meta.url;
export const repoRoot =
  typeof metaUrl === "string" ? path.resolve(path.dirname(fileURLToPath(metaUrl)), "../..") : process.cwd();
export const videosDir = path.join(repoRoot, "videos");
export const videoDir = (name: string) => path.join(videosDir, name);
