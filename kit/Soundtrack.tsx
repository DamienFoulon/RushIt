import { Audio } from "@remotion/media";
import { interpolate, Sequence, staticFile, useVideoConfig } from "remotion";
import type { Music } from "./schema";

/** Frames over which a join between two segments is faded, each side. */
const JOIN = 3;

/** One stretch of the track: `length` frames from frame `from`, read from `start` seconds of `file`. */
export type SoundtrackPiece = { from: number; length: number; start: number; first: boolean; last: boolean };

/**
 * What the film plays. When `music add` has assembled the edit as a WAV
 * (`edited`), that one file from start to end, without seeking: the render is
 * then the same every time. Otherwise, the source segments back to back, each
 * one found by seeking in the track.
 */
export const soundtrackPieces = (
  music: Music,
  fps: number,
): { kind: "edited"; file: string } | { kind: "segments"; file: string; pieces: SoundtrackPiece[] } => {
  if (music.edited) return { kind: "edited", file: music.edited };
  let at = 0;
  const pieces = music.segments.map(([start, end], i) => {
    const length = Math.round((end - start) * fps);
    const piece = { from: at, length, start, first: i === 0, last: i === music.segments.length - 1 };
    at += length;
    return piece;
  });
  return { kind: "segments", file: music.file, pieces };
};

/** The track, played as its edit: see `soundtrackPieces`. */
export const Soundtrack: React.FC<{ music: Music }> = ({ music }) => {
  const { fps } = useVideoConfig();
  const plan = soundtrackPieces(music, fps);
  if (plan.kind === "edited") return <Audio src={staticFile(plan.file)} />;
  return (
    <>
      {plan.pieces.map((p) => (
        <Sequence key={p.from} from={p.from} durationInFrames={p.length} layout="none">
          <Audio
            src={staticFile(plan.file)}
            trimBefore={Math.round(p.start * fps)}
            volume={(f) =>
              interpolate(f, [0, JOIN, p.length - JOIN, p.length], [p.first ? 1 : 0, 1, 1, p.last ? 1 : 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })
            }
          />
        </Sequence>
      ))}
    </>
  );
};
