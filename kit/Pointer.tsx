import { interpolate, useCurrentFrame } from "remotion";
import { shotAt } from "./motion";

export type Waypoint = { readonly at: number; readonly x: number; readonly y: number };

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** The pointer guides the eye. It never does what the keyboard does. */
export const Pointer: React.FC<{ path: readonly Waypoint[]; clicks?: readonly number[]; from?: number; to?: number }> = ({
  path,
  clicks = [],
  from = 0,
  to = Infinity,
}) => {
  const frame = useCurrentFrame();
  if (frame < from || frame > to) return null;
  const shot = shotAt(path.map((p) => ({ ...p, zoom: 1 })), frame);
  const click = clicks.find((c) => frame >= c && frame < c + 12);
  const pressed = click !== undefined && frame < click + 4;
  return (
    <div style={{ position: "absolute", zIndex: 50, pointerEvents: "none", left: shot.x, top: shot.y }}>
      {click !== undefined && (
        <span
          style={{
            position: "absolute", width: 44, height: 44, left: -22, top: -22, borderRadius: 999,
            border: "2px solid var(--accent, currentColor)",
            opacity: interpolate(frame, [click, click + 12], [0.8, 0], clamp),
            scale: interpolate(frame, [click, click + 12], [0.4, 1.3], clamp),
          }}
        />
      )}
      <svg width="26" height="30" viewBox="0 0 26 30" style={{ scale: pressed ? 0.88 : 1, transformOrigin: "0 0" }}>
        <path
          d="M2 2 L2 24 L8 18.5 L12.5 28 L16.5 26.2 L12 17 L20 17 Z"
          fill="var(--pointer, var(--ink, #111))"
          stroke="white"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
