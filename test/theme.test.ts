import { describe, expect, it } from "vitest";
import { themeToCss } from "../kit/theme";

describe("themeToCss", () => {
  it("fait une variable CSS par couleur, plus la police principale", () => {
    const css = themeToCss({
      colors: { bg: "#fff", "ink-2": "#333" },
      fonts: [{ family: "Inter", file: "assets/fonts/inter.woff2", weight: "400" }],
      layout: { stage: { left: 0, top: 0, width: 1, height: 1 }, window: { width: 1, height: 1 } },
      ease: [0.22, 1, 0.36, 1],
    });
    expect(css).toEqual({ "--bg": "#fff", "--ink-2": "#333", "--font": '"Inter", sans-serif' });
  });

  it("se passe de police quand le thème n'en déclare aucune", () => {
    const css = themeToCss({
      colors: {},
      fonts: [],
      layout: { stage: { left: 0, top: 0, width: 1, height: 1 }, window: { width: 1, height: 1 } },
      ease: [0.22, 1, 0.36, 1],
    });
    expect(css).toEqual({ "--font": "sans-serif" });
  });
});
