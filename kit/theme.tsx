import { loadFont } from "@remotion/fonts";
import { useEffect, useState, type ReactNode } from "react";
import { cancelRender, continueRender, delayRender, Easing, staticFile } from "remotion";
import { LayoutContext } from "./layout";
import { EaseContext } from "./motion";
import type { Theme } from "./schema";

/** The theme as CSS variables: one per colour, plus --font for the first font. */
export const themeToCss = (theme: Theme): Record<string, string> => ({
  ...Object.fromEntries(Object.entries(theme.colors).map(([name, value]) => [`--${name}`, value])),
  "--font": theme.fonts.length ? `"${theme.fonts[0].family}", sans-serif` : "sans-serif",
});

/**
 * Sets the theme's variables, curve and layout for everything below, and holds
 * the render until every declared font is loaded from the video folder. A font
 * that fails to load stops the render: never a silent fallback.
 */
export const ThemeProvider: React.FC<{ theme: Theme; children: ReactNode }> = ({ theme, children }) => {
  const [handle] = useState(() => delayRender("Chargement des polices du thème"));
  useEffect(() => {
    const load = (f: Theme["fonts"][number]) =>
      loadFont({ family: f.family, url: staticFile(f.file), weight: f.weight }).catch((err: Error) => {
        throw new Error(`Police ${f.family} (${f.file}) introuvable ou illisible : ${err.message}`);
      });
    Promise.all(theme.fonts.map(load))
      .then(() => continueRender(handle))
      .catch((err: Error) => cancelRender(err));
  }, [handle, theme.fonts]);
  const ease = Easing.bezier(...theme.ease);
  return (
    <EaseContext.Provider value={ease}>
      <LayoutContext.Provider value={theme.layout}>
        <div style={{ ...themeToCss(theme), position: "absolute", inset: 0, fontFamily: "var(--font)" } as React.CSSProperties}>
          {children}
        </div>
      </LayoutContext.Provider>
    </EaseContext.Provider>
  );
};
