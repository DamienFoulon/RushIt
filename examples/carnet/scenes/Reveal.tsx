import { useCurrentFrame } from "remotion";
import { at, Pointer, ProductWindow, useLayout, WIDE, type SceneProps } from "rushit/kit";
import { NotesApp } from "../app/NotesApp";

export const Reveal: React.FC<SceneProps> = ({ beat }) => {
  const frame = useCurrentFrame();
  const layout = useLayout();
  const visible = Math.min(4, Math.max(0, Math.floor(frame / beat)));
  const zoomAt = at(beat, 6);
  return (
    <ProductWindow shots={[{ at: 0, ...WIDE(layout) }, { at: zoomAt, ...WIDE(layout) }, { at: zoomAt + at(beat, 2), x: 860, y: 333, zoom: 1.35 }]}>
      <NotesApp visible={visible} highlight={frame > zoomAt + at(beat, 2) ? 0 : undefined} />
      <Pointer path={[{ at: zoomAt, x: 1300, y: 700 }, { at: zoomAt + at(beat, 2), x: 700, y: 138 }]} from={zoomAt} />
    </ProductWindow>
  );
};
