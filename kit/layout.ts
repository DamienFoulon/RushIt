import { createContext, useContext } from "react";
import type { Layout } from "./schema";

export const LayoutContext = createContext<Layout | null>(null);

export const useLayout = (): Layout => {
  const layout = useContext(LayoutContext);
  if (!layout) throw new Error("useLayout : le composant doit être rendu dans <ThemeProvider>");
  return layout;
};
