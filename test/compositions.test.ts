import { execFileSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("racine Remotion", () => {
  it("expose Film et Animatic pour la vidéo courante, à la bonne durée", () => {
    const out = execFileSync("npx", ["remotion", "compositions", "--quiet"], {
      env: { ...process.env, RUSHIT_VIDEO_DIR: path.resolve("test/fixtures/video-min") },
      encoding: "utf8",
    });
    expect(out).toMatch(/Film/);
    expect(out).toMatch(/Animatic/);
  }, 180_000);
});
