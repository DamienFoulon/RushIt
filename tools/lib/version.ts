import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { repoRoot } from "./paths";

export const rushitVersion = (): string => JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8")).version;
export const lockHash = (): string =>
  createHash("sha256").update(readFileSync(path.join(repoRoot, "package-lock.json"))).digest("hex").slice(0, 16);
