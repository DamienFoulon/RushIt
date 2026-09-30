import { remotionFfmpeg } from "../lib/remotion";

/**
 * The whole file as mono 32-bit float PCM. Remotion's ffmpeg has no raw
 * `f32le` muxer, so it writes 16-bit WAV and the samples are read from the
 * `data` chunk (its size field is not filled in when ffmpeg writes to a pipe).
 */
export const decodeMono = (file: string, sampleRate = 44_100): Float32Array => {
  const wav = remotionFfmpeg(["-v", "error", "-i", file, "-ac", "1", "-ar", String(sampleRate), "-c:a", "pcm_s16le", "-f", "wav", "-"]);
  if (wav.toString("ascii", 0, 4) !== "RIFF") throw new Error(`Pas de données audio dans ${file}`);
  let at = 12;
  while (at + 8 <= wav.length && wav.toString("ascii", at, at + 4) !== "data") at += 8 + wav.readUInt32LE(at + 4);
  if (at + 8 > wav.length) throw new Error(`Pas de données audio dans ${file}`);
  const start = at + 8;
  const count = Math.floor((wav.length - start) / 2);
  const out = new Float32Array(count);
  for (let i = 0; i < count; i++) out[i] = wav.readInt16LE(start + 2 * i) / 32768;
  return out;
};
