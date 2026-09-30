/** Positive change of RMS energy, frame by frame: where attacks are. */
export const onsetEnvelope = (signal: Float32Array, sampleRate: number, hop = 512) => {
  const n = Math.floor(signal.length / hop);
  const values = new Float32Array(n);
  let previous = 0;
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = i * hop; j < (i + 1) * hop; j++) sum += signal[j] * signal[j];
    const rms = Math.sqrt(sum / hop);
    values[i] = Math.max(0, rms - previous);
    previous = rms;
  }
  return { values, hop, sampleRate };
};

/** Of the four ways to group beats in bars of four, the one whose first beats hit hardest. */
export const pickDownbeatPhase = (beats: readonly number[], strengthAt: (t: number) => number): 0 | 1 | 2 | 3 => {
  const scores = [0, 1, 2, 3].map((phase) =>
    beats.filter((_, i) => i % 4 === phase).reduce((sum, t) => sum + strengthAt(t), 0),
  );
  return scores.indexOf(Math.max(...scores)) as 0 | 1 | 2 | 3;
};

/** Low-pass at `cutoff` Hz, two Butterworth biquads in a row: what is left is the bass and the kick. */
export const lowPass = (signal: Float32Array, sampleRate: number, cutoff: number): Float32Array => {
  let x = signal;
  for (let pass = 0; pass < 2; pass++) {
    const w = (2 * Math.PI * cutoff) / sampleRate;
    const alpha = Math.sin(w) / (2 * Math.SQRT1_2);
    const cos = Math.cos(w);
    const a0 = 1 + alpha;
    const b0 = (1 - cos) / 2 / a0;
    const b1 = (1 - cos) / a0;
    const a1 = (-2 * cos) / a0;
    const a2 = (1 - alpha) / a0;
    const y = new Float32Array(x.length);
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < x.length; i++) {
      const v = b0 * x[i] + b1 * x1 + b0 * x2 - a1 * y1 - a2 * y2;
      x2 = x1;
      x1 = x[i];
      y2 = y1;
      y1 = v;
      y[i] = v;
    }
    x = y;
  }
  return x;
};

/** Strongest value of an onset envelope within `radius` seconds of `t`. */
export const envelopeAt = (env: { values: Float32Array; hop: number; sampleRate: number }, t: number, radius = 0) => {
  const frame = (s: number) => Math.round((s * env.sampleRate) / env.hop);
  let max = 0;
  for (let i = Math.max(0, frame(t - radius)); i <= frame(t + radius) && i < env.values.length; i++) max = Math.max(max, env.values[i]);
  return max;
};

/**
 * A beat tracker can lock on the offbeat. When the half-beat positions carry
 * clearly more attack than the beats themselves (`ratio` times more on
 * average), every beat moves by half a pulse.
 */
export const correctOffbeat = (
  beats: readonly number[],
  strengthAt: (t: number) => number,
  ratio = 1.25,
): { beats: number[]; shifted: boolean } => {
  if (beats.length < 2) return { beats: [...beats], shifted: false };
  const halves = beats.map((t, i) => t + ((beats[i + 1] ?? t + (t - beats[i - 1])) - t) / 2);
  const mean = (list: readonly number[]) => list.reduce((s, t) => s + strengthAt(t), 0) / list.length;
  const onBeats = mean(beats);
  const onHalves = mean(halves.slice(0, -1));
  return onHalves > ratio * onBeats ? { beats: halves, shifted: true } : { beats: [...beats], shifted: false };
};

const normalize = (v: readonly number[]) => {
  const n = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / n);
};

const barChroma = (chromas: readonly (readonly number[])[], from: number) => {
  const sum = new Array(12).fill(0);
  for (let i = from; i < from + 4 && i < chromas.length; i++) chromas[i].forEach((v, k) => (sum[k] += v));
  return normalize(sum);
};

/** How far the harmony of the bar starting on beat `i` is from the bar before: chords change on first beats. */
export const harmonyChange = (chromas: readonly (readonly number[])[], i: number): number => {
  if (i < 4) return 0;
  const a = barChroma(chromas, i);
  const b = barChroma(chromas, i - 4);
  return Math.sqrt(a.reduce((s, v, k) => s + (v - b[k]) ** 2, 0));
};

/** Several strengths of different scales, each divided by its mean over the beats, then added. */
export const normalizedSum = (beats: readonly number[], parts: readonly ((t: number) => number)[]) => {
  const means = parts.map((f) => beats.reduce((s, t) => s + f(t), 0) / Math.max(1, beats.length) || 1);
  return (t: number) => parts.reduce((s, f, k) => s + f(t) / means[k], 0);
};
