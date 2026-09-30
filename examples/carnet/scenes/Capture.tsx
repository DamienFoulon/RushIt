import { AbsoluteFill, useCurrentFrame } from "remotion";
import { at, Keys, Pointer, ProductWindow, progress, typed, useEase, useLayout, type SceneProps } from "rushit/kit";
import { frameOn } from "../app/camera";
import { listBox, NotesApp } from "../app/NotesApp";
import { HOVER } from "./Reveal";

const DRAFT = "Rappeler le fournisseur avant midi #achats";
const PER_CHAR = 1.2;

/**
 * Same shot as the end of the previous scene. The pointer leaves, Ctrl N opens
 * a draft at the top of the list, the draft is typed, Entrée saves it. Then
 * the window empties and leaves, before the logo comes in.
 */
export const Capture: React.FC<SceneProps> = ({ beat, duration }) => {
  const frame = useCurrentFrame();
  const ease = useEase();
  const layout = useLayout();
  const { stage } = layout;
  const ctrlN = at(beat, 1);
  const open = progress(frame, ctrlN + 5, ctrlN + 17, ease);
  const typeFrom = ctrlN + 19;
  const enter = typeFrom + Math.ceil(DRAFT.length * PER_CHAR) + 6;
  const saved = progress(frame, enter + 4, enter + 14, ease);
  const end = duration - 1;
  const fade = progress(frame, end - 18, end - 10, ease);
  const leave = progress(frame, end - 11, end, ease);
  return (
    <>
      <AbsoluteFill
        style={{ opacity: 1 - leave, scale: 1 - 0.04 * leave, transformOrigin: `${stage.left + stage.width / 2}px ${stage.top + stage.height / 2}px` }}
      >
        <ProductWindow
          shots={[
            { at: ctrlN + 5, ...frameOn(listBox(false), layout) },
            { at: ctrlN + 19, ...frameOn(listBox(true), layout) },
          ]}
        >
          <div style={{ position: "absolute", inset: 0, opacity: 1 - fade }}>
            <NotesApp
              rows={[1, 1, 1, 1]}
              sidebar={[0, 0, 0, 0, 0, 0]}
              hover={1 - progress(frame, 2, 14, ease)}
              draft={frame >= ctrlN + 5 ? { text: typed(DRAFT, frame, typeFrom, PER_CHAR), open, saved } : undefined}
            />
          </div>
          <Pointer path={[{ at: 2, ...HOVER }, { at: ctrlN - 2, x: 1320, y: 820 }]} to={ctrlN - 2} />
        </ProductWindow>
      </AbsoluteFill>
      <Keys presses={[{ at: ctrlN, keys: ["Ctrl", "N"] }, { at: enter, keys: ["Entrée"], hold: 20 }]} />
    </>
  );
};
