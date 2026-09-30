import { essentia } from "./beats";

const FRAME = 4096;

/** Summed 12-bin chroma (HPCP) of a span, frame by frame, and the number of frames. */
const chromaSum = (span: Float32Array, hop: number) => {
  const chroma = new Array(12).fill(0);
  let frames = 0;
  for (let i = 0; i + FRAME <= span.length; i += hop) {
    const w = essentia.Windowing(essentia.arrayToVector(span.subarray(i, i + FRAME))).frame;
    const spectrum = essentia.Spectrum(w).spectrum;
    const peaks = essentia.SpectralPeaks(spectrum);
    const hpcp = essentia.vectorToArray(essentia.HPCP(peaks.frequencies, peaks.magnitudes).hpcp) as Float32Array;
    hpcp.forEach((v, k) => (chroma[k % 12] += v));
    frames++;
  }
  return { chroma, frames };
};

/** Energy and 12-bin chroma of one span of the signal: what a join must match on both sides. */
export const barFeatures = (signal: Float32Array, sampleRate: number, from: number, to: number) => {
  const span = signal.subarray(Math.floor(from * sampleRate), Math.floor(to * sampleRate));
  let sum = 0;
  for (const s of span) sum += s * s;
  const { chroma, frames } = chromaSum(span, FRAME);
  return { energy: Math.sqrt(sum / Math.max(1, span.length)), chroma: chroma.map((c) => c / Math.max(1, frames)) };
};

export const featureDistance = (a: { energy: number; chroma: number[] }, b: { energy: number; chroma: number[] }) => {
  const energy = Math.abs(a.energy - b.energy) / Math.max(a.energy, b.energy, 1e-6);
  const chroma = Math.sqrt(a.chroma.reduce((s, v, k) => s + (v - b.chroma[k]) ** 2, 0));
  return energy + chroma;
};

/** Chroma of each beat, from it to the next, scaled to unit length. */
export const beatChromas = (signal: Float32Array, sampleRate: number, beats: readonly number[]): number[][] =>
  beats.map((t, i) => {
    const end = beats[i + 1] ?? t + (t - (beats[i - 1] ?? t - 0.5));
    const { chroma } = chromaSum(signal.subarray(Math.floor(t * sampleRate), Math.floor(end * sampleRate)), FRAME / 2);
    const n = Math.sqrt(chroma.reduce((s, v) => s + v * v, 0)) || 1;
    return chroma.map((v) => v / n);
  });
