import { describe, expect, it } from "vitest";
import { remotionFfmpeg } from "../tools/lib/remotion";

describe("remotionFfmpeg", () => {
  it("lance le ffmpeg de Remotion sans vidéo courante", () => {
    const saved = process.env.RUSHIT_VIDEO_DIR;
    delete process.env.RUSHIT_VIDEO_DIR;
    try {
      expect(remotionFfmpeg(["-version"]).toString()).toMatch(/^ffmpeg version/);
    } finally {
      if (saved !== undefined) process.env.RUSHIT_VIDEO_DIR = saved;
    }
  });
});
