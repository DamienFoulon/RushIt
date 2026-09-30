import { Audio } from "@remotion/media";
import { interpolate, Sequence, staticFile, useVideoConfig } from "remotion";
import type { Music } from "./schema";

/** Frames over which a join between two segments is faded, each side. */
const JOIN = 3;

/** The track, played as its edit: its source segments back to back. */
export const Soundtrack: React.FC<{ music: Music }> = ({ music }) => {
  const { fps } = useVideoConfig();
  let at = 0;
  const pieces = music.segments.map(([start, end], i) => {
    const length = Math.round((end - start) * fps);
    const piece = { from: at, length, start, first: i === 0, last: i === music.segments.length - 1 };
    at += length;
    return piece;
  });
  return (
    <>
      {pieces.map((p) => (
        <Sequence key={p.from} from={p.from} durationInFrames={p.length} layout="none">
          <Audio
            src={staticFile(music.file)}
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
