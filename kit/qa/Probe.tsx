import { useEffect } from "react";
import { continueRender, delayRender, useCurrentFrame } from "remotion";
import { measure } from "./measure";

const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r(null)));

/**
 * Measures the frame once everything else is ready (fonts, images, every other
 * delayRender) and posts the facts to the check's collector. Never logs: Remotion
 * copies the page's console to the terminal.
 */
export const Probe: React.FC<{ endpoint: string }> = ({ endpoint }) => {
  const frame = useCurrentFrame();
  useEffect(() => {
    const handle = delayRender("Passe de contrôle : mesure");
    let cancelled = false;
    const handles = () => (window as unknown as { remotion_delayRenderHandles?: number[] }).remotion_delayRenderHandles ?? [];
    (async () => {
      while (!cancelled && handles().some((h) => h !== handle)) await new Promise((r) => setTimeout(r, 20));
      await document.fonts.ready;
      await Promise.all(Array.from(document.images).map((i) => i.decode().catch(() => null)));
      await nextFrame();
      await nextFrame();
      if (cancelled) return;
      let body: string;
      try {
        body = JSON.stringify(measure(frame));
      } catch (e) {
        body = JSON.stringify({ frame, width: 0, height: 0, expects: [], texts: [], overlaps: [], error: String((e as Error).stack ?? e) });
      }
      await fetch(endpoint, { method: "POST", mode: "no-cors", headers: { "content-type": "text/plain" }, body });
      continueRender(handle);
    })().catch(() => continueRender(handle));
    return () => {
      cancelled = true;
      continueRender(handle);
    };
  }, [frame, endpoint]);
  return null;
};
