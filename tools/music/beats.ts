import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { Essentia, EssentiaWASM } = require("essentia.js");
const essentia = new Essentia(EssentiaWASM);

/** Tempo and beat times, in seconds, of a mono 44.1 kHz signal. */
export const trackBeats = (signal: Float32Array): { bpm: number; beats: number[] } => {
  const r = essentia.RhythmExtractor2013(essentia.arrayToVector(signal), 208, "multifeature", 40);
  return { bpm: r.bpm, beats: Array.from(essentia.vectorToArray(r.ticks) as Float32Array) };
};

export { essentia };
