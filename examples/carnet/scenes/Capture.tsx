import { useCurrentFrame } from "remotion";
import { at, Keys, ProductWindow, typed, type SceneProps } from "rushit/kit";
import { NotesApp } from "../app/NotesApp";

const DRAFT = "Rappeler le fournisseur avant midi #achats";

export const Capture: React.FC<SceneProps> = ({ beat }) => {
  const frame = useCurrentFrame();
  const start = at(beat, 2);
  return (
    <>
      <ProductWindow shots={[{ at: 0, x: 860, y: 333, zoom: 1.35 }]}>
        <NotesApp visible={4} draft={frame >= start ? typed(DRAFT, frame, start + 6, 1.4) : undefined} />
      </ProductWindow>
      <Keys presses={[{ at: at(beat, 1), keys: ["Ctrl", "N"] }, { at: start + 6 + Math.ceil(DRAFT.length * 1.4) + 6, keys: ["Entrée"] }]} />
    </>
  );
};
