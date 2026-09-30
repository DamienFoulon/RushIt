import { Easing, interpolate } from "remotion";
import { createContext, useContext } from "react";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** The video's own curve, set by ThemeProvider from theme.ease. */
export const EaseContext = createContext<(t: number) => number>(Easing.bezier(0.22, 1, 0.36, 1));
export const useEase = () => useContext(EaseContext);

/** Beats to frames, rounded: `at(beat, 2.5)` is two and a half beats in. */
export const at = (beat: number, beats: number) => Math.round(beat * beats);

/** 0 → 1 between two frames, on the given curve (linear by default outside React). */
export const progress = (frame: number, from: number, to: number, ease: (t: number) => number = Easing.bezier(0.22, 1, 0.36, 1)) =>
  interpolate(frame, [from, to], [0, 1], { ...clamp, easing: ease });

/** The first characters of `text`, typed from `from` at `perChar` frames each. */
export const typed = (text: string, frame: number, from: number, perChar = 1.2) =>
  text.slice(0, Math.max(0, Math.floor((frame - from) / perChar)));

export type Shot = { readonly at: number; readonly x: number; readonly y: number; readonly zoom: number };

/** The camera at `frame`, eased between keyframes, held before the first and after the last. */
export const shotAt = (shots: readonly Shot[], frame: number, ease?: (t: number) => number): Shot => {
  if (frame <= shots[0].at) return shots[0];
  for (let i = 1; i < shots.length; i++) {
    const a = shots[i - 1];
    const b = shots[i];
    if (frame <= b.at) {
      const p = progress(frame, a.at, b.at, ease);
      return { at: frame, x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p, zoom: a.zoom + (b.zoom - a.zoom) * p };
    }
  }
  return shots[shots.length - 1];
};
