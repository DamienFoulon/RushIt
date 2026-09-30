/** The downbeat nearest to `seconds`, or `seconds` itself when there is no grid. */
export const snapToDownbeat = (downbeats: readonly number[], seconds: number): number =>
  downbeats.length === 0
    ? seconds
    : downbeats.reduce((best, beat) => (Math.abs(beat - seconds) < Math.abs(best - seconds) ? beat : best), downbeats[0]);

export type TimedScene = {
  readonly id: string;
  readonly from: number;
  readonly durationInFrames: number;
  /** Frame, relative to the scene, where each on-screen line appears. */
  readonly textsAt: readonly number[];
};

/**
 * Every scene placed on the grid, in frames. The first scene starts at 0 and
 * the last one ends with the film, whatever the snapping did. A second line
 * comes in on the downbeat nearest the middle of its scene.
 */
export const timeScenes = (
  scenes: readonly { id: string; at: number; texts: readonly string[] }[],
  grid: { downbeats: readonly number[]; outputDuration: number },
  fps: number,
): TimedScene[] => {
  const end = Math.round(grid.outputDuration * fps);
  const starts = scenes.map((s, i) => (i === 0 ? 0 : Math.round(snapToDownbeat(grid.downbeats, s.at) * fps)));
  return scenes.map((s, i) => {
    const from = starts[i];
    const to = starts[i + 1] ?? end;
    const middle = snapToDownbeat(grid.downbeats, (from + to) / 2 / fps) * fps;
    return {
      id: s.id,
      from,
      durationInFrames: to - from,
      textsAt: s.texts.map((_, t) => (t === 0 ? 0 : Math.round(middle) - from)),
    };
  });
};

export const framesPerBeat = (bpm: number | undefined, fps: number) => (fps * 60) / (bpm ?? 120);
