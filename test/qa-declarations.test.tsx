import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Allow, Layer } from "../kit/qa/Allow";
import { Expect } from "../kit/qa/Expect";
import { SceneContext } from "../kit/qa/SceneContext";

const inScene = (node: React.ReactNode) =>
  renderToStaticMarkup(<SceneContext.Provider value={{ id: "s3", from: 100 }}>{node}</SceneContext.Provider>);

describe("Expect", () => {
  it("pose ses bornes en images absolues", () => {
    const html = inScene(<Expect id="palette" visible={[10, 40]} hidden={[0, 9]}><b>x</b></Expect>);
    expect(html).toContain('data-rushit-expect="palette"');
    expect(html).toContain('data-rushit-visible="110,140"');
    expect(html).toContain('data-rushit-hidden="100,109"');
    expect(html).toContain("display:contents");
  });

  it("refuse d'être rendu hors d'une scène", () => {
    expect(() => renderToStaticMarkup(<Expect id="x" visible={[0, 1]}>x</Expect>)).toThrow(/scène/);
  });
});

describe("Allow et Layer", () => {
  it("pose les contrôles acceptés et la raison", () => {
    const html = renderToStaticMarkup(<Allow checks={["petit-texte", "contraste"]} reason="détail">x</Allow>);
    expect(html).toContain('data-rushit-allow="petit-texte contraste"');
    expect(html).toContain('data-rushit-reason="détail"');
  });

  it("Layer accepte le chevauchement", () => {
    expect(renderToStaticMarkup(<Layer>x</Layer>)).toContain('data-rushit-allow="chevauchement"');
  });
});
