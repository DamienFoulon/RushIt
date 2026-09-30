import type { TimedScene } from "../../kit/timing";

/** Frames the first pass renders: cuts, settled lines, and a regular step. */
export const sampleFrames = ({
  timed, fps, totalFrames, stepSeconds, scene,
}: { timed: readonly TimedScene[]; fps: number; totalFrames: number; stepSeconds: number; scene?: string }): number[] => {
  const scenes = scene ? timed.filter((t) => t.id === scene) : timed;
  if (scene && scenes.length === 0) throw new Error(`Scène inconnue : ${scene}`);
  const lo = scene ? scenes[0].from : 0;
  const hi = scene ? scenes[0].from + scenes[0].durationInFrames - 1 : totalFrames - 1;
  const out = new Set<number>();
  for (const t of scenes) {
    out.add(t.from + 3);
    out.add(t.from + t.durationInFrames - 1 - 3);
    for (const at of t.textsAt) out.add(t.from + at + 12);
  }
  const step = Math.max(1, Math.round(stepSeconds * fps));
  for (let f = lo; f <= hi; f += step) out.add(f);
  return [...out].filter((f) => f >= lo && f <= hi).sort((a, b) => a - b);
};

/** First and last frame of each expectation interval not rendered yet, clamped to the range. */
export const boundFrames = (bounds: readonly [number, number][], already: ReadonlySet<number>, [lo, hi]: [number, number]) => {
  const out = new Set<number>();
  for (const [a, b] of bounds) for (const f of [a, b]) {
    const c = Math.min(hi, Math.max(lo, f));
    if (!already.has(c)) out.add(c);
  }
  return [...out].sort((x, y) => x - y);
};
