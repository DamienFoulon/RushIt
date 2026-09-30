import { describe, expect, it } from "vitest";
import { creditText } from "../kit/Film";
import { VideoJson, type Music } from "../kit/schema";
import { soundtrackPieces } from "../kit/Soundtrack";

const music: Music = {
  file: "audio/m.mp3", title: "T", artist: "A", licence: "CC BY 4.0", credit: "Musique : T, par A (CC BY 4.0)",
  creditRequired: true, pageUrl: "https://example.org", bpm: 120,
  segments: [[0, 4], [10, 12]], downbeats: [0, 2, 4], outputDuration: 6,
};

const video = (m: Music | undefined) =>
  VideoJson.parse({
    rushit: "0.1.0",
    durationSeconds: 6,
    format: { width: 640, height: 360, fps: 30 },
    theme: { colors: {}, fonts: [], layout: { stage: { left: 0, top: 0, width: 1, height: 1 }, window: { width: 1, height: 1 } } },
    music: m,
  });

describe("soundtrackPieces", () => {
  it("joue le montage assemblé en WAV, d'un seul tenant, quand il existe", () => {
    expect(soundtrackPieces({ ...music, edited: "audio/m.edit.wav" }, 30)).toEqual({ kind: "edited", file: "audio/m.edit.wav" });
  });

  it("sans montage assemblé, enchaîne les segments du MP3", () => {
    expect(soundtrackPieces(music, 30)).toEqual({
      kind: "segments",
      file: "audio/m.mp3",
      pieces: [
        { from: 0, length: 120, start: 0, first: true, last: false },
        { from: 120, length: 60, start: 10, first: false, last: true },
      ],
    });
  });
});

describe("creditText", () => {
  it("affiche le crédit quand la licence l'exige", () => expect(creditText(video(music))).toBe(music.credit));
  it("n'affiche rien quand la licence ne l'exige pas", () => expect(creditText(video({ ...music, creditRequired: false }))).toBeNull());
  it("n'affiche rien sans musique", () => expect(creditText(video(undefined))).toBeNull());
});
