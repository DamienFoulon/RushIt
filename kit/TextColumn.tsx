import { interpolate, useCurrentFrame } from "remotion";
import { useLayout } from "./layout";
import { useEase } from "./motion";
import type { Layout } from "./schema";

type Props = { texts: readonly string[]; textsAt: readonly number[] };

/** The scene's lines in the text column. Nothing when the video has no column. */
export const TextColumn: React.FC<Props> = ({ texts, textsAt }) => {
  const { textColumn } = useLayout();
  if (!textColumn) return null;
  return <TextColumnLines texts={texts} textsAt={textsAt} column={textColumn} />;
};

/** The lines themselves, each one rising into place at its frame. */
export const TextColumnLines: React.FC<Props & { column: NonNullable<Layout["textColumn"]> }> = ({
  texts,
  textsAt,
  column,
}) => {
  const frame = useCurrentFrame();
  const ease = useEase();
  const opts = { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease } as const;
  return (
    <div
      style={{
        position: "absolute", top: 0, height: "100%", display: "flex", flexDirection: "column",
        justifyContent: "center", gap: 40, left: column.left, width: column.width,
      }}
    >
      {texts.map((text, i) => (
        <p
          key={text}
          data-rushit-column=""
          style={{
            margin: 0, fontSize: 60, lineHeight: 1.12, fontWeight: 600, letterSpacing: "-0.025em",
            textWrap: "balance", color: i === 0 ? "var(--title, var(--ink))" : "var(--accent, var(--ink))",
            opacity: interpolate(frame, [textsAt[i], textsAt[i] + 12], [0, 1], opts),
            translate: `0px ${interpolate(frame, [textsAt[i], textsAt[i] + 12], [24, 0], opts)}px`,
          }}
        >
          {text}
        </p>
      ))}
    </div>
  );
};
