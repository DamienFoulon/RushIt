import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll } from "vitest";

/**
 * Temporary folders for one test file, removed once the file is done. Call it
 * at the top of the file, where it registers the cleanup, and use what it
 * returns wherever a folder is needed.
 */
export const tempDirs = (prefix: string) => {
  const made: string[] = [];
  afterAll(() => {
    for (const dir of made) rmSync(dir, { recursive: true, force: true });
  });
  return () => {
    const dir = mkdtempSync(path.join(tmpdir(), prefix));
    made.push(dir);
    return dir;
  };
};
