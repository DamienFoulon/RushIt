import { z } from "zod";

// The contract of a video folder: video.json. The kit reads its theme and its
// music from here, the tools write it. Every path is relative to the video
// folder, which is also Remotion's public dir.

const Rect = z.object({ left: z.number(), top: z.number(), width: z.number().positive(), height: z.number().positive() });

export const Layout = z.object({
  /** Optional: a video may have no text column at all. */
  textColumn: z.object({ left: z.number(), width: z.number().positive() }).optional(),
  stage: Rect,
  /** Logical size the product window is drawn at, before being fitted to the stage. */
  window: z.object({ width: z.number().positive(), height: z.number().positive() }),
});

export const Theme = z.object({
  /** Each name becomes a CSS variable: `accent` gives `--accent`. */
  colors: z.record(z.string().regex(/^[a-z][a-z0-9-]*$/, "nom de couleur : minuscules, chiffres et tirets"), z.string()),
  fonts: z.array(z.object({ family: z.string(), file: z.string(), weight: z.string().default("400") })),
  layout: Layout,
  /** Cubic-bezier of the video's own ease, four numbers. */
  ease: z.tuple([z.number(), z.number(), z.number(), z.number()]).default([0.22, 1, 0.36, 1]),
});

export const Music = z
  .object({
    file: z.string(),
    title: z.string(),
    artist: z.string(),
    licence: z.string(),
    credit: z.string(),
    creditRequired: z.boolean(),
    pageUrl: z.string(),
    bpm: z.number().positive(),
    /** Source spans in seconds, played back to back. */
    segments: z.array(z.tuple([z.number().min(0), z.number()])).min(1),
    /** Bar starts, in output seconds. */
    downbeats: z.array(z.number()),
    /** Every beat, in output seconds: what `music -- shift` regroups in bars. Written by `music add`. */
    beats: z.array(z.number()).optional(),
    outputDuration: z.number().positive(),
  })
  .refine((m) => m.segments.every(([a, b]) => b > a), { message: "chaque segment doit finir après son début" });

export const VideoJson = z.object({
  rushit: z.string(),
  /** Target length in seconds. With music, the film lasts music.outputDuration. */
  durationSeconds: z.number().positive(),
  format: z.object({ width: z.number().int().positive(), height: z.number().int().positive(), fps: z.number().int().positive() }),
  theme: Theme,
  music: Music.optional(),
  /** Seconds of the frame used as the poster. Defaults to one second before the end. */
  posterSeconds: z.number().min(0).optional(),
  /** Filled by lot 4 (sound effects). */
  sfx: z.array(z.unknown()).default([]),
});

export type VideoJson = z.infer<typeof VideoJson>;
export type Theme = z.infer<typeof Theme>;
export type Layout = z.infer<typeof Layout>;
export type Music = z.infer<typeof Music>;

/** Length of the film in seconds: the edited track when there is one. */
export const filmSeconds = (v: VideoJson) => v.music?.outputDuration ?? v.durationSeconds;
