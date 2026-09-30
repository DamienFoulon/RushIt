import { execFileSync } from "node:child_process";
import { statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { tempDirs } from "./helpers/tmp";

const tmp = tempDirs("rushit-still-");

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
    const png = path.join(tmp(), "film.png");
    execFileSync("npx", ["remotion", "still", "Film", png, "--frame=2"], { env, stdio: "pipe" });
    expect(statSync(png).size).toBeGreaterThan(100);
  }, 180_000);
});

describe("configuration Remotion", () => {
  it("laisse passer les commandes générales sans vidéo sélectionnée", () => {
    const bare = { ...process.env };
    delete bare.RUSHIT_VIDEO_DIR;
    const out = execFileSync("npx", ["remotion", "versions"], { env: bare, encoding: "utf8", stdio: "pipe" });
    expect(out).toMatch(/4\.0\.530/);
  }, 180_000);
});
