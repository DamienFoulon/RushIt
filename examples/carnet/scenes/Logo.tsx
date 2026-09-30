import { AbsoluteFill, useCurrentFrame } from "remotion";
import { at, progress, useEase, type SceneProps } from "rushit/kit";
import { texts } from "../texts";

export const Logo: React.FC<SceneProps> = ({ beat }) => {
  const frame = useCurrentFrame();
  const ease = useEase();
  const word = progress(frame, 0, at(beat, 1), ease);
  const line = progress(frame, at(beat, 4), at(beat, 5), ease);
  return (
    <AbsoluteFill style={{ display: "grid", placeItems: "center", alignContent: "center", gap: 32 }}>
      <div style={{ fontSize: 160, fontWeight: 800, letterSpacing: "-0.04em", opacity: word, translate: `0px ${(1 - word) * 30}px` }}>Carnet</div>
      <div style={{ fontSize: 44, color: "var(--accent)", opacity: line }}>{texts.signature}</div>
    </AbsoluteFill>
  );
};
