import { AbsoluteFill, useCurrentFrame } from "remotion";
import { at, progress, useEase, type SceneProps } from "rushit/kit";
import { texts } from "../texts";

const WORD = "Carnet";

/** Full frame: the word rises letter by letter, the signature follows a bar later. */
export const Logo: React.FC<SceneProps> = ({ beat }) => {
  const frame = useCurrentFrame();
  const ease = useEase();
  const line = progress(frame, at(beat, 4), at(beat, 4) + 16, ease);
  return (
    <AbsoluteFill style={{ display: "grid", placeItems: "center", alignContent: "center", gap: 36 }}>
      <div style={{ fontSize: 160, lineHeight: 1, fontWeight: 800, letterSpacing: "-0.04em", whiteSpace: "nowrap" }}>
        {[...WORD].map((c, i) => {
          const p = progress(frame, 3 + 3 * i, 3 + 3 * i + 18, ease);
          return (
            <span key={i} style={{ display: "inline-block", opacity: p, translate: `0px ${(1 - p) * 36}px` }}>
              {c}
            </span>
          );
        })}
      </div>
      <div style={{ fontSize: 44, fontWeight: 500, color: "var(--accent)", opacity: line, translate: `0px ${(1 - line) * 16}px` }}>
        {texts.signature}
      </div>
    </AbsoluteFill>
  );
};
