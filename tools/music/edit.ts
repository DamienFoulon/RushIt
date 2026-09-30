/**
 * Keeps the start of the track up to a downbeat, then jumps to a later
 * downbeat so that the track's own ending lands on the target, within half a
 * bar. Of the joins that fit, the one whose two sides sound most alike wins.
 * The intro plays for at least a third of the target.
 */
export const proposeEdit = ({
  downbeats,
  duration,
  target,
  distance,
}: {
  downbeats: readonly number[];
  duration: number;
  target: number;
  distance: (a: number, b: number) => number;
}): { segments: [number, number][]; warning?: string } => {
  const bar = downbeats.length > 1 ? downbeats[1] - downbeats[0] : 2;
  if (duration < target - bar / 2)
    return { segments: [[0, duration]], warning: `Le morceau (${duration.toFixed(1)} s) est plus court que la vidéo (${target} s) : il n'est pas bouclé.` };
  if (duration <= target + bar / 2) return { segments: [[0, duration]] };
  let best: { a: number; b: number; d: number } | null = null;
  for (const a of downbeats) {
    if (a < target / 3 || a >= target) continue;
    for (const b of downbeats) {
      if (b <= a) continue;
      if (Math.abs(a + (duration - b) - target) > bar / 2) continue;
      const d = distance(a, b);
      if (!best || d < best.d) best = { a, b, d };
    }
  }
  if (!best) return { segments: [[0, duration]], warning: "Aucun raccord sur les premiers temps ne tient la durée : montage à faire à la main." };
  return { segments: [[0, best.a], [best.b, duration]] };
};

/**
 * Source downbeats mapped to output seconds, in order. Each segment keeps the
 * downbeats from its start up to, not including, its end: a downbeat on a join
 * is counted once, and none sits on the very end of the music.
 */
export const toOutputDownbeats = (downbeats: readonly number[], segments: readonly [number, number][]): number[] => {
  const out: number[] = [];
  let offset = 0;
  for (const [start, end] of segments) {
    for (const t of downbeats) if (t >= start && t < end) out.push(Math.round((t - start + offset) * 1000) / 1000);
    offset += end - start;
  }
  return [...new Set(out)];
};

/**
 * The same beats grouped in bars one way further along: `n` beats later, or
 * earlier when negative. Four beats is a whole bar, so the grid comes back.
 * The current phase is read from the beat nearest the first downbeat.
 */
export const shiftDownbeats = (beats: readonly number[], downbeats: readonly number[], n: number): number[] => {
  if (beats.length === 0 || downbeats.length === 0) return [...downbeats];
  const first = beats.reduce((best, t, i) => (Math.abs(t - downbeats[0]) < Math.abs(beats[best] - downbeats[0]) ? i : best), 0);
  const phase = (((first + n) % 4) + 4) % 4;
  return beats.filter((_, i) => i % 4 === phase);
};
