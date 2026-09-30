import { useContext, type ReactNode } from "react";
import { SceneContext } from "./SceneContext";

type Range = readonly [number, number];
const abs = (from: number, r?: Range) => (r ? `${from + r[0]},${from + r[1]}` : undefined);

/**
 * Declares when its content must be seen, or must not. Frames are local to the
 * scene, bounds included. No visual effect: the check reads the attributes.
 */
export const Expect: React.FC<{ id: string; visible?: Range; hidden?: Range; children: ReactNode }> = ({ id, visible, hidden, children }) => {
  const scene = useContext(SceneContext);
  if (!scene) throw new Error(`<Expect id="${id}"> doit être rendu dans une scène du film`);
  return (
    <div
      data-rushit-expect={id}
      data-rushit-visible={abs(scene.from, visible)}
      data-rushit-hidden={abs(scene.from, hidden)}
      style={{ display: "contents" }}
    >
      {children}
    </div>
  );
};
