import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { checkAssets, readVideo, writeVideo } from "../tools/lib/video";
import { tempDirs } from "./helpers/tmp";

const tmp = tempDirs("rushit-video-");

const video = {
  rushit: "0.1.0",
  durationSeconds: 20,
  format: { width: 1920, height: 1080, fps: 30 },
  theme: {
    colors: { bg: "#fff" },
    fonts: [{ family: "Inter", file: "assets/fonts/inter.woff2", weight: "400" }],
    layout: { stage: { left: 0, top: 0, width: 100, height: 100 }, window: { width: 100, height: 100 } },
  },
  music: {
    file: "audio/m.mp3", title: "T", artist: "A", licence: "CC0", credit: "", creditRequired: false,
    pageUrl: "", bpm: 100, segments: [[0, 10]], downbeats: [0], outputDuration: 10,
  },
  sfx: [],
};

describe("readVideo / writeVideo", () => {
  it("relit ce qu'il a écrit", () => {
    const dir = tmp();
    writeVideo(dir, video as never);
    expect(readVideo(dir).theme.colors.bg).toBe("#fff");
  });

  it("nomme le dossier quand video.json est invalide", () => {
    const dir = tmp();
    writeFileSync(path.join(dir, "video.json"), JSON.stringify({ rushit: 1 }));
    expect(() => readVideo(dir)).toThrow(dir);
  });
});

describe("checkAssets", () => {
  it("liste la police et le morceau déclarés mais absents", () => {
    const dir = tmp();
    expect(checkAssets(dir, video as never)).toEqual(["assets/fonts/inter.woff2", "audio/m.mp3"]);
  });

  it("ne liste rien quand tout est là", () => {
    const dir = tmp();
    mkdirSync(path.join(dir, "assets/fonts"), { recursive: true });
    mkdirSync(path.join(dir, "audio"));
    writeFileSync(path.join(dir, "assets/fonts/inter.woff2"), "x");
    writeFileSync(path.join(dir, "audio/m.mp3"), "x");
    expect(checkAssets(dir, video as never)).toEqual([]);
  });
});
