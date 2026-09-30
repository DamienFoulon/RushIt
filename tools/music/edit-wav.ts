import { writeFileSync } from "node:fs";
import path from "node:path";
import { readVideo, writeVideo } from "../lib/video";
import { decodeStereo16 } from "./decode";

/** Sample rate of the edit: the one Remotion mixes at. */
export const EDIT_RATE = 48_000;

/** Frames over which a join between two segments is faded, each side (as in the kit's Soundtrack). */
export const JOIN_FRAMES = 3;

/** A 16-bit stereo PCM WAV of interleaved samples: a fixed 44-byte header, nothing that varies. */
export const encodeWav = (samples: Int16Array, rate = EDIT_RATE): Buffer => {
  const data = samples.length * 2;
  const wav = Buffer.alloc(44 + data);
  wav.write("RIFF", 0, "ascii");
  wav.writeUInt32LE(36 + data, 4);
  wav.write("WAVE", 8, "ascii");
  wav.write("fmt ", 12, "ascii");
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(2, 22);
  wav.writeUInt32LE(rate, 24);
  wav.writeUInt32LE(rate * 4, 28);
  wav.writeUInt16LE(4, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36, "ascii");
  wav.writeUInt32LE(data, 40);
  for (let i = 0; i < samples.length; i++) wav.writeInt16LE(samples[i], 44 + 2 * i);
  return wav;
};

/**
 * The segments of `source` (interleaved stereo) back to back. Each join fades
 * out then in over `fadeSamples` on each side, so no sample jumps at the cut.
 * Output boundaries are rounded from the running sum of segment lengths, so
 * the whole edit lasts the sum of the segments to one sample. Past the end of
 * the source, silence.
 */
export const assembleEdit = (source: Int16Array, segments: [number, number][], rate: number, fadeSamples: number): Int16Array => {
  const frames = source.length / 2;
  const total = segments.reduce((s, [a, b]) => s + b - a, 0);
  const out = new Int16Array(Math.round(total * rate) * 2);
  let elapsed = 0;
  segments.forEach(([start, end], k) => {
    const from = Math.round(elapsed * rate);
    elapsed += end - start;
    const length = Math.round(elapsed * rate) - from;
    const offset = Math.round(start * rate);
    const first = k === 0;
    const last = k === segments.length - 1;
    for (let i = 0; i < length; i++) {
      const src = offset + i;
      if (src >= frames) break;
      let gain = 1;
      if (!first && i < fadeSamples) gain = Math.min(gain, i / fadeSamples);
      if (!last && length - 1 - i < fadeSamples) gain = Math.min(gain, (length - 1 - i) / fadeSamples);
      out[2 * (from + i)] = Math.round(source[2 * src] * gain);
      out[2 * (from + i) + 1] = Math.round(source[2 * src + 1] * gain);
    }
  });
  return out;
};

/**
 * Writes the video's edit once, as `audio/<track>.edit.wav`, and declares it
 * in video.json (`music.edited`). The film then plays one file from start to
 * end: no seeking in the compressed track at render time, whose imprecision
 * made two renders of the same video differ.
 */
export const buildEditWav = (dir: string): string => {
  const video = readVideo(dir);
  if (!video.music) throw new Error(`Cette vidéo n'a pas de morceau : ${dir}`);
  const music = video.music;
  const source = decodeStereo16(path.join(dir, music.file), EDIT_RATE);
  const fade = Math.round((JOIN_FRAMES * EDIT_RATE) / video.format.fps);
  const rel = path.posix.join(path.posix.dirname(music.file), `${path.posix.basename(music.file).replace(/\.[^.]+$/, "")}.edit.wav`);
  const file = path.join(dir, rel);
  writeFileSync(file, encodeWav(assembleEdit(source, music.segments, EDIT_RATE, fade)));
  writeVideo(dir, { ...video, music: { ...music, edited: rel } });
  return file;
};
