import { fitScale, type Layout } from "rushit/kit";
import type { Box } from "./NotesApp";

/** Room left, on screen, between what a shot shows and the edge of the stage. */
export const SAFE = 56;

/**
 * The shot that shows `box` as large as it fits, centred, `margin` screen
 * pixels from every edge of the stage. Outside the window, the stage shows the
 * app's own background, so the camera may look past the window's top.
 */
export const frameOn = (box: Box, layout: Layout, margin = SAFE) => {
  const { stage } = layout;
  const scale = Math.min((stage.width - 2 * margin) / (box.right - box.left), (stage.height - 2 * margin) / (box.bottom - box.top));
  return { x: (box.left + box.right) / 2, y: (box.top + box.bottom) / 2, zoom: scale / fitScale(layout) };
};
