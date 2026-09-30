import { AbsoluteFill, useCurrentFrame } from "remotion";
import { at, progress, useEase, useLayout, type SceneProps } from "rushit/kit";
import { notes } from "../app/NotesApp";

const spots = [
  { x: 120, y: 60, r: -6, label: "Post-it" },
  { x: 560, y: 110, r: 4, label: "E-mail" },
  { x: 220, y: 380, r: 3, label: "Message" },
  { x: 640, y: 420, r: -4, label: "Cahier" },
];

export const Scattered: React.FC<SceneProps> = ({ beat, duration }) => {
  const frame = useCurrentFrame();
  const ease = useEase();
  const { stage } = useLayout();
  // Every paper has landed before they gather, over the last two beats.
  const gather = progress(frame, duration - at(beat, 2), duration, ease);
  return (
    <AbsoluteFill>
      {spots.map((s, i) => {
        const shown = progress(frame, at(beat, i), at(beat, i) + 10, ease);
        const x = stage.left + s.x + (stage.width / 2 - 180 - s.x) * gather;
        const y = stage.top + s.y + (stage.height / 2 - 60 - s.y) * gather;
        return (
          <div
            key={s.label}
            style={{
              position: "absolute", left: x, top: y, width: 360, padding: "20px 24px", borderRadius: 12,
              background: "var(--surface)", border: "1px solid var(--line)", boxShadow: "0 8px 24px rgba(43,38,33,0.12)",
              rotate: `${s.r * (1 - gather)}deg`, opacity: shown * (1 - gather * 0.6), scale: 0.9 + 0.1 * shown,
            }}
          >
            <div style={{ fontSize: 16, color: "var(--muted)" }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 600 }}>{notes[i].title}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
