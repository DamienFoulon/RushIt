import { useCurrentFrame } from "remotion";
import { at, frameOn, Pointer, ProductWindow, progress, useEase, useLayout, WIDE, type SceneProps } from "rushit/kit";
import { app, listBox, NotesApp, notes, rowTop } from "../app/NotesApp";

/** Where the pointer rests on the first note: past the end of its preview, under its tag. */
export const HOVER = { x: 980, y: rowTop(0) + app.row / 2 + 14 };

/** Out of the close shot, bottom right: where the pointer comes from and goes back to. */
export const OFFSHOT = { x: 1060, y: 660 };

/**
 * The window left by the pile fills in (sidebar, heading, then one note per
 * beat). The sidebar steps back before the camera moves in on the list, so no
 * text ever slides against the edge of the stage. The pointer comes in from
 * outside the shot and rests on the first note.
 */
export const Reveal: React.FC<SceneProps> = ({ beat }) => {
  const frame = useCurrentFrame();
  const ease = useEase();
  const layout = useLayout();
  const zoomAt = at(beat, 6);
  const zoomed = at(beat, 8);
  const close = frameOn(listBox(false), layout);
  const dim = progress(frame, zoomAt - 10, zoomAt, ease);
  const sidebar = [2, 8, 11, 14, 17, 20].map((f) => progress(frame, f, f + 12, ease) * (1 - dim));
  const rows = notes.map((_, i) => progress(frame, at(beat, 1.5 + i), at(beat, 1.5 + i) + 14, ease));
  const arrive = zoomed + at(beat, 1.5);
  return (
    <ProductWindow shots={[{ at: zoomAt, ...WIDE(layout) }, { at: zoomed, ...close }]}>
      <NotesApp rows={rows} sidebar={sidebar} heading={progress(frame, 5, 17, ease)} hover={progress(frame, arrive - 4, arrive + 8, ease)} />
      <Pointer path={[{ at: zoomed + 2, ...OFFSHOT }, { at: arrive, ...HOVER }]} from={zoomed + 2} />
    </ProductWindow>
  );
};
