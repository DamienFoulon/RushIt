import { describe, expect, it } from "vitest";
import { VideoJson } from "../kit/schema";

const minimal = {
  rushit: "0.1.0",
  durationSeconds: 20,
  format: { width: 1920, height: 1080, fps: 30 },
  theme: {
    colors: { bg: "#f4f6f9", ink: "#1b2737", accent: "#1e56a0" },
    fonts: [{ family: "Inter", file: "assets/fonts/inter.woff2", weight: "100 900" }],
    layout: {
      textColumn: { left: 96, width: 600 },
      stage: { left: 760, top: 198, width: 1096, height: 685 },
      window: { width: 1440, height: 900 },
    },
  },
  sfx: [],
};

describe("VideoJson", () => {
  it("accepte une vidéo minimale sans musique", () => {
    expect(VideoJson.parse(minimal).music).toBeUndefined();
  });

  it("accepte une vidéo sans colonne de texte", () => {
    const { textColumn: _drop, ...layout } = minimal.theme.layout;
    const v = VideoJson.parse({ ...minimal, theme: { ...minimal.theme, layout } });
    expect(v.theme.layout.textColumn).toBeUndefined();
  });

  it("refuse un nom de couleur qui ne ferait pas une variable CSS", () => {
    const bad = { ...minimal, theme: { ...minimal.theme, colors: { "mauvais nom": "#000" } } };
    expect(() => VideoJson.parse(bad)).toThrow();
  });

  it("refuse une musique dont les segments ne sont pas croissants", () => {
    const music = {
      file: "audio/m.mp3", title: "T", artist: "A", licence: "CC BY 4.0", credit: "c",
      creditRequired: true, pageUrl: "https://example.org", bpm: 100,
      segments: [[10, 5]], downbeats: [0], outputDuration: 5,
    };
    expect(() => VideoJson.parse({ ...minimal, music })).toThrow(/segment/);
  });
});
