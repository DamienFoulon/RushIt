import { interpolate, useCurrentFrame } from "remotion";
import { useLayout } from "./layout";
import { progress, useEase } from "./motion";
import type { Layout } from "./schema";

type Props = { texts: readonly string[]; textsAt: readonly number[]; duration: number };

/** Frames over which a line rises into place, and over which the lines leave at the end of the scene. */
const ENTER = 12;
const EXIT = 8;

/**
 * Where a line stands at `frame`: it rises into place from `at`, and leaves
 * upwards over the scene's last EXIT frames, gone on its last frame.
 */
export const columnLine = (frame: number, at: number, duration: number, ease: (t: number) => number) => {
  const opts = { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease } as const;
  const leave = progress(frame, duration - 1 - EXIT, duration - 1, ease);
  return {
    opacity: interpolate(frame, [at, at + ENTER], [0, 1], opts) * (1 - leave),
    y: interpolate(frame, [at, at + ENTER], [24, 0], opts) - 16 * leave,
  };
};

/** The scene's lines in the text column. Nothing when the video has no column. */
export const TextColumn: React.FC<Props> = (props) => {
  const { textColumn } = useLayout();
  if (!textColumn) return null;
  return <TextColumnLines {...props} column={textColumn} />;
};

/** The lines themselves, each one rising into place at its frame, all leaving together at the end of the scene. */
export const TextColumnLines: React.FC<Props & { column: NonNullable<Layout["textColumn"]> }> = ({
  texts,
  textsAt,
  duration,
  column,
}) => {
  const frame = useCurrentFrame();
  const ease = useEase();
  return (
    <div
      style={{
        position: "absolute", top: 0, height: "100%", display: "flex", flexDirection: "column",
        justifyContent: "center", gap: 40, left: column.left, width: column.width,
      }}
    >
      {texts.map((text, i) => {
        const line = columnLine(frame, textsAt[i], duration, ease);
        return (
          <p
            key={text}
            data-rushit-column=""
            style={{
              margin: 0, fontSize: 60, lineHeight: 1.12, fontWeight: 600, letterSpacing: "-0.025em",
              textWrap: "balance", color: i === 0 ? "var(--title, var(--ink))" : "var(--accent, var(--ink))",
              opacity: line.opacity, translate: `0px ${line.y}px`,
            }}
          >
            {text}
          </p>
        );
      })}
    </div>
  );
};
