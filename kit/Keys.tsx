import { interpolate, useCurrentFrame } from "remotion";
import { useLayout } from "./layout";

export type Press = { readonly at: number; readonly keys: readonly string[]; readonly hold?: number };

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** The keys say what the keyboard does, under the stage, one chord at a time. */
export const Keys: React.FC<{ presses: readonly Press[] }> = ({ presses }) => {
  const frame = useCurrentFrame();
  const { stage } = useLayout();
  const press = presses.find((p) => frame >= p.at && frame < p.at + (p.hold ?? 24));
  if (!press) return null;
  const end = press.at + (press.hold ?? 24);
  const down = frame < press.at + 5;
  return (
    <div
      style={{
        position: "absolute", display: "flex", justifyContent: "center", gap: 12,
        left: stage.left, width: stage.width, top: stage.top + stage.height + 40,
        opacity: interpolate(frame, [press.at, press.at + 4, end - 4, end], [0, 1, 1, 0], clamp),
      }}
    >
      {press.keys.map((key, i) => (
        <kbd
          key={i}
          style={{
            display: "grid", placeItems: "center", height: 64, minWidth: 64, padding: "0 16px", borderRadius: 12,
            border: "1px solid var(--line, #ccc)", background: "var(--surface, #fff)", color: "var(--ink, #111)",
            fontFamily: "var(--font)", fontSize: 30, fontWeight: 500,
            boxShadow: down ? "0 1px 0 var(--line, #ccc)" : "0 4px 0 var(--line, #ccc)",
            translate: down ? "0px 3px" : "0px 0px",
          }}
        >
          {key}
        </kbd>
      ))}
    </div>
  );
};
