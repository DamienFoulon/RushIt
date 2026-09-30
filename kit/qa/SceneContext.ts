import { createContext } from "react";

/** The scene being rendered and its first frame in the film: set by Film. */
export const SceneContext = createContext<{ id: string; from: number } | null>(null);
