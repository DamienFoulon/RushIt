import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LayoutContext } from "../kit/layout";
import { fitScale, WIDE } from "../kit/ProductWindow";
import { TextColumn } from "../kit/TextColumn";
import type { Layout } from "../kit/schema";

const layout: Layout = {
  textColumn: { left: 96, width: 600 },
  stage: { left: 760, top: 198, width: 1096, height: 685 },
  window: { width: 1440, height: 900 },
};

describe("ProductWindow", () => {
  it("fait tenir la fenêtre logique dans la scène", () => expect(fitScale(layout)).toBeCloseTo(685 / 900));
  it("le plan large vise le centre de la fenêtre", () => expect(WIDE(layout)).toEqual({ x: 720, y: 450, zoom: 1 }));
});

// L'animation des lignes (TextColumnLines) n'a pas de test unitaire : elle lit
// l'image courante par useCurrentFrame, que Remotion ne fournit qu'au sein de
// son lecteur ou de son rendu. La simuler demanderait ses internes, qui changent
// d'une version à l'autre. Les rendus des tâches 5, 9 et 13 la couvrent.
describe("TextColumn", () => {
  it("n'affiche rien quand la vidéo n'a pas de colonne de texte", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { textColumn: _drop, ...noColumn } = layout;
    const html = renderToStaticMarkup(
      <LayoutContext.Provider value={noColumn}>
        <TextColumn texts={["Une ligne"]} textsAt={[0]} />
      </LayoutContext.Provider>,
    );
    expect(html).toBe("");
  });
});
