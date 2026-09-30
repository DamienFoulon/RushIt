import { createHash } from "node:crypto";

/** Stable across re-timing: check, scene and element, never the frame. */
export const findingId = (check: string, scene: string | null, element: string) =>
  createHash("sha1").update(`${check}|${scene ?? ""}|${element}`).digest("hex").slice(0, 8);
