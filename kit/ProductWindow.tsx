import type { ReactNode } from "react";
import { useCurrentFrame } from "remotion";
import { useLayout } from "./layout";
import { shotAt, useEase, type Shot } from "./motion";
import type { Layout } from "./schema";

/** Zoom 1: the whole logical window fits the stage. */
export const fitScale = (l: Layout) => Math.min(l.stage.width / l.window.width, l.stage.height / l.window.height);

/** The wide shot: centre of the window, zoom 1. */
export const WIDE = (l: Layout) => ({ x: l.window.width / 2, y: l.window.height / 2, zoom: 1 });

/**
 * The product window on the stage, seen through a camera. Children are laid
 * out in logical window pixels. The pointer goes inside too, so it moves with
 * what it points at.
 */
export const ProductWindow: React.FC<{ shots: readonly Shot[]; children: ReactNode; radius?: number }> = ({
  shots,
  children,
  radius = 18,
}) => {
  const frame = useCurrentFrame();
  const layout = useLayout();
  const shot = shotAt(shots, frame, useEase());
  const scale = fitScale(layout) * shot.zoom;
  const { stage, window } = layout;
  return (
    <div
      style={{
        position: "absolute", overflow: "hidden", borderRadius: radius,
        left: stage.left, top: stage.top, width: stage.width, height: stage.height,
        background: "var(--surface, var(--bg))", boxShadow: "var(--shadow, 0 8px 24px rgba(0,0,0,0.14))",
      }}
    >
      <div
        style={{
          position: "absolute", left: 0, top: 0, width: window.width, height: window.height, transformOrigin: "0 0",
          transform: `translate(${stage.width / 2}px, ${stage.height / 2}px) scale(${scale}) translate(${-shot.x}px, ${-shot.y}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
};
