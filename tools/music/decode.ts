import { remotionFfmpeg } from "../lib/remotion";

/**
 * The whole file as 16-bit WAV bytes from `data` on. Remotion's ffmpeg has no
 * raw PCM muxer, so it writes 16-bit WAV and the samples are read from the
 * `data` chunk (its size field is not filled in when ffmpeg writes to a pipe).
 */
export const decodePcm16 = (file: string, channels: number, sampleRate: number): Buffer => {
  const wav = remotionFfmpeg(["-v", "error", "-i", file, "-ac", String(channels), "-ar", String(sampleRate), "-c:a", "pcm_s16le", "-f", "wav", "-"]);
  if (wav.toString("ascii", 0, 4) !== "RIFF") throw new Error(`Pas de données audio dans ${file}`);
  let at = 12;
  while (at + 8 <= wav.length && wav.toString("ascii", at, at + 4) !== "data") at += 8 + wav.readUInt32LE(at + 4);
  if (at + 8 > wav.length) throw new Error(`Pas de données audio dans ${file}`);
  const data = wav.subarray(at + 8);
  return data.subarray(0, data.length - (data.length % (2 * channels)));
};

/** The whole file as mono 32-bit float PCM. */
export const decodeMono = (file: string, sampleRate = 44_100): Float32Array => {
  const data = decodePcm16(file, 1, sampleRate);
  const out = new Float32Array(data.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = data.readInt16LE(2 * i) / 32768;
  return out;
};

/** The whole file as interleaved stereo 16-bit PCM, decoded from its start (no seeking). */
export const decodeStereo16 = (file: string, sampleRate: number): Int16Array => {
  const data = decodePcm16(file, 2, sampleRate);
  const out = new Int16Array(data.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = data.readInt16LE(2 * i);
  return out;
};
