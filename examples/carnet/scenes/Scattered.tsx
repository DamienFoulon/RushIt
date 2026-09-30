import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { at, progress, useEase, useLayout, type SceneProps } from "rushit/kit";
import { notes } from "../app/NotesApp";

const W = 480;
const H = 116;

// Where each paper lands, relative to the stage: apart, so that every title reads on its own.
const spots = [
  { x: 30, y: 80, r: -4, label: "Post-it" },
  { x: 586, y: 60, r: 3, label: "E-mail" },
  { x: 80, y: 430, r: 3, label: "Message" },
  { x: 560, y: 480, r: -3, label: "Cahier" },
];
// In the pile, each paper sits a few pixels off the one above it: only the last one reads.
const pile = [
  { dx: -15, dy: -15, r: -1.2 },
  { dx: -10, dy: -10, r: 0.8 },
  { dx: -5, dy: -5, r: -0.6 },
  { dx: 0, dy: 0, r: 0 },
];

const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/**
 * The papers land one per beat, then stack up, fully opaque, the last one on
 * top. The top paper empties, then grows into the product window of the next
 * scene: the old picture leaves before the new one comes in.
 */
export const Scattered: React.FC<SceneProps> = ({ beat, duration }) => {
  const frame = useCurrentFrame();
  const ease = useEase();
  const { stage } = useLayout();
  const end = duration - 1;
  const gatherFrom = end - 38;
  // The top paper lands, then its content leaves, then it grows.
  const empty = progress(frame, end - 15, end - 10, ease);
  const grow = progress(frame, end - 11, end, ease);
  return (
    <AbsoluteFill>
      {spots.map((s, i) => {
        const land = progress(frame, at(beat, i), at(beat, i) + 12, ease);
        const gather = progress(frame, gatherFrom + 3 * i, gatherFrom + 3 * i + 14, ease);
        const top = i === spots.length - 1;
        // As soon as the next paper sets off to cover it, a paper empties: no letter peeks out from under.
        const coveredFrom = gatherFrom + 3 * (i + 1);
        const covered = progress(frame, coveredFrom, coveredFrom + 6, ease);
        const g = top ? grow : 0;
        const x = lerp(lerp(s.x, stage.width / 2 - W / 2 + pile[i].dx, gather), 0, g);
        const y = lerp(lerp(s.y, stage.height / 2 - H / 2 + pile[i].dy, gather), 0, g);
        return (
          <div
            key={s.label}
            style={{
              position: "absolute", boxSizing: "border-box", overflow: "hidden",
              left: stage.left + x, top: stage.top + y + (1 - land) * 28,
              width: lerp(W, stage.width, g), height: lerp(H, stage.height, g),
              padding: "24px 28px", borderRadius: lerp(12, 18, g), background: "var(--surface)",
              border: `1px solid color-mix(in srgb, var(--line) ${Math.round((1 - g) * 100)}%, transparent)`,
              boxShadow: `0 ${lerp(10, 8, g)}px ${lerp(28, 24, g)}px rgba(0,0,0,0.14)`,
              rotate: `${lerp(s.r, pile[i].r, gather)}deg`, scale: interpolate(land, [0, 1], [0.94, 1]), opacity: land,
            }}
          >
            <div style={{ opacity: top ? 1 - empty : 1 - covered, whiteSpace: "nowrap" }}>
              <div style={{ fontSize: 16, lineHeight: "20px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)" }}>
                {s.label}
              </div>
              <div style={{ fontSize: 26, lineHeight: "36px", fontWeight: 600, marginTop: 8 }}>{notes[i].title}</div>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
