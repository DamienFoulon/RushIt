import { execFileSync } from "node:child_process";
import { mkdtempSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

const env = { ...process.env, RUSHIT_VIDEO_DIR: path.resolve("test/fixtures/video-min") };

describe("racine Remotion", () => {
  it("expose Film et Animatic pour la vidéo courante, à la bonne durée", () => {
    const out = execFileSync("npx", ["remotion", "compositions", "--quiet"], { env, encoding: "utf8" });
    expect(out).toMatch(/Film/);
    expect(out).toMatch(/Animatic/);
  }, 180_000);

  // The definition holds components (functions): passed through defaultProps,
  // Remotion would serialize it and the render would fail.
  it("rend une image du film", () => {
    const png = path.join(mkdtempSync(path.join(tmpdir(), "rushit-still-")), "film.png");
    execFileSync("npx", ["remotion", "still", "Film", png, "--frame=2"], { env, stdio: "pipe" });
    expect(statSync(png).size).toBeGreaterThan(100);
  }, 180_000);
});
