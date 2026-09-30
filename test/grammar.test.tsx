import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LayoutContext } from "../kit/layout";
import { Easing } from "remotion";
import { creditStart } from "../kit/Film";
import { fitScale, frameOn, WIDE } from "../kit/ProductWindow";
import { columnLine, TextColumn } from "../kit/TextColumn";
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

describe("frameOn", () => {
  // Where a logical point lands on the stage, for a shot.
  const onStage = (shot: { x: number; y: number; zoom: number }, px: number, py: number) => {
    const s = fitScale(layout) * shot.zoom;
    return { x: layout.stage.width / 2 + (px - shot.x) * s, y: layout.stage.height / 2 + (py - shot.y) * s };
  };
  const box = { left: 300, top: 100, right: 700, bottom: 300 };

  it("vise le centre de la boîte", () => {
    const shot = frameOn(box, layout);
    expect([shot.x, shot.y]).toEqual([500, 200]);
  });
  it("laisse la marge demandée à l'écran, sur le côté qui borne le zoom", () => {
    const shot = frameOn(box, layout, 56);
    const a = onStage(shot, box.left, box.top);
    const b = onStage(shot, box.right, box.bottom);
    const margins = [a.x, a.y, layout.stage.width - b.x, layout.stage.height - b.y];
    expect(Math.min(...margins)).toBeCloseTo(56);
    for (const m of margins) expect(m).toBeGreaterThanOrEqual(56 - 1e-9);
  });
  it("borne le zoom par la scène : une boîte large se cadre sur sa largeur", () => {
    const wide = { left: 0, top: 0, right: 1400, bottom: 100 };
    const shot = frameOn(wide, layout, 40);
    expect(fitScale(layout) * shot.zoom).toBeCloseTo((layout.stage.width - 80) / 1400);
  });
});

describe("sortie de la colonne de texte", () => {
  const ease = Easing.bezier(0.22, 1, 0.36, 1);
  it("une ligne est pleine au milieu de la scène", () => expect(columnLine(60, 0, 120, ease)).toEqual({ opacity: 1, y: 0 }));
  it("elle a disparu à la dernière image de la scène", () => expect(columnLine(119, 0, 120, ease).opacity).toBe(0));
  it("elle sort sur les 8 dernières images, vers le haut", () => {
    expect(columnLine(111, 0, 120, ease)).toEqual({ opacity: 1, y: 0 });
    const leaving = columnLine(115, 0, 120, ease);
    expect(leaving.opacity).toBeGreaterThan(0);
    expect(leaving.opacity).toBeLessThan(1);
    expect(leaving.y).toBeLessThan(0);
  });
  it("elle entre toujours depuis le bas à son image", () => {
    expect(columnLine(30, 30, 120, ease)).toEqual({ opacity: 0, y: 24 });
  });
});

describe("crédit musical", () => {
  it("attend un temps dans la dernière scène, pour ne pas s'afficher sur un fond vide", () => {
    const timed = [
      { id: "a", from: 0, durationInFrames: 100, textsAt: [] },
      { id: "b", from: 100, durationInFrames: 80, textsAt: [] },
    ];
    expect(creditStart(timed, 16.7)).toBe(117);
  });
});

// L'animation des lignes dans la page est couverte par le rendu d'une image
// fixe dans test/qa-stills.test.ts.
describe("TextColumn", () => {
  it("n'affiche rien quand la vidéo n'a pas de colonne de texte", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { textColumn: _drop, ...noColumn } = layout;
    const html = renderToStaticMarkup(
      <LayoutContext.Provider value={noColumn}>
        <TextColumn texts={["Une ligne"]} textsAt={[0]} duration={60} />
      </LayoutContext.Provider>,
    );
    expect(html).toBe("");
  });
});
