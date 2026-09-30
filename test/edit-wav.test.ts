import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildEditWav, EDIT_RATE, encodeWav } from "../tools/music/edit-wav";
import { checkAssets, readVideo } from "../tools/lib/video";
import { tempDirs } from "./helpers/tmp";

const tmp = tempDirs("rushit-editwav-");

/** A 440 Hz sine, stereo, 44.1 kHz: resampled to 48 kHz by the decoder, like any track. */
const sine = (seconds: number, rate = 44_100): Int16Array => {
  const out = new Int16Array(Math.round(seconds * rate) * 2);
  for (let i = 0; i < out.length / 2; i++) out[2 * i] = out[2 * i + 1] = Math.round(16_000 * Math.sin((2 * Math.PI * 440 * i) / rate));
  return out;
};

/** Samples of a 16-bit stereo WAV written by encodeWav, left channel. */
const leftOf = (wav: Buffer) => {
  const data = wav.subarray(44);
  const out = new Int16Array(data.length / 4);
  for (let i = 0; i < out.length; i++) out[i] = data.readInt16LE(4 * i);
  return out;
};

/**
 * A video whose track is the sine, cut in two segments. 2.3007 s and 5.1 s
 * sit on different phases of the sine: without a fade, the join jumps.
 */
const videoWithSine = (segments: [number, number][]) => {
  const dir = tmp();
  mkdirSync(path.join(dir, "audio"));
  writeFileSync(path.join(dir, "audio/sinus.wav"), encodeWav(sine(10), 44_100));
  const video = JSON.parse(readFileSync("test/fixtures/video-min/video.json", "utf8"));
  video.music = {
    file: "audio/sinus.wav", title: "Sinus", artist: "test", licence: "CC0", credit: "", creditRequired: false,
    pageUrl: "", bpm: 120, segments, downbeats: [0], outputDuration: segments.reduce((s, [a, b]) => s + b - a, 0),
  };
  writeFileSync(path.join(dir, "video.json"), JSON.stringify(video));
  return dir;
};

const SEGMENTS: [number, number][] = [[0, 2.3007], [5.1, 7.4]];

describe("buildEditWav", () => {
  it("écrit le même WAV, octet pour octet, deux fois de suite", () => {
    const dir = videoWithSine(SEGMENTS);
    const first = readFileSync(buildEditWav(dir));
    const second = readFileSync(buildEditWav(dir));
    expect(second.equals(first)).toBe(true);
  });

  it("déclare le WAV dans video.json, et checkAssets le vérifie", () => {
    const dir = videoWithSine(SEGMENTS);
    buildEditWav(dir);
    const video = readVideo(dir);
    expect(video.music?.edited).toBe("audio/sinus.edit.wav");
    expect(checkAssets(dir, video)).toEqual([]);
    writeFileSync(path.join(dir, "video.json"), JSON.stringify({ ...video, music: { ...video.music, edited: "audio/absent.wav" } }));
    expect(checkAssets(dir, readVideo(dir))).toEqual(["audio/absent.wav"]);
  });

  it("dure la somme des segments, à un échantillon près", () => {
    const dir = videoWithSine(SEGMENTS);
    const wav = readFileSync(buildEditWav(dir));
    expect(wav.readUInt32LE(24)).toBe(EDIT_RATE);
    expect(wav.readUInt16LE(22)).toBe(2);
    const expected = SEGMENTS.reduce((s, [a, b]) => s + b - a, 0) * EDIT_RATE;
    expect(Math.abs(leftOf(wav).length - expected)).toBeLessThanOrEqual(1);
  });

  it("raccorde sans clic : aucun saut d'un échantillon à l'autre au-delà de la pente du sinus", () => {
    const dir = videoWithSine(SEGMENTS);
    const left = leftOf(readFileSync(buildEditWav(dir)));
    // Steepest step of the sine itself at 48 kHz, with some room for resampling.
    const slope = 16_000 * 2 * Math.PI * (440 / EDIT_RATE) * 1.2;
    const join = Math.round(2.3007 * EDIT_RATE);
    let worst = 0;
    for (let i = join - 400; i < join + 400; i++) worst = Math.max(worst, Math.abs(left[i + 1] - left[i]));
    expect(worst).toBeLessThan(slope);
  });
});
