import { describe, expect, it } from "vitest";
import type { ProbeReport, TextFact } from "../kit/qa/types";
import { analyze } from "../tools/qa/analyze";
import { findingId } from "../tools/qa/ids";
import { DEFAULT_RULES } from "../tools/qa/rules";

const layout = { textColumn: { left: 40, width: 360 }, stage: { left: 440, top: 60, width: 800, height: 600 }, window: { width: 800, height: 600 } };
const text = (over: Partial<TextFact>): TextFact => ({
  key: "s|p|Bonjour", scene: "s", selector: "p", text: "Bonjour", words: 1, column: false,
  box: { x: 500, y: 100, w: 200, h: 40 }, inFrame: 1, opacity: 1, fontPx: 32, bold: false,
  overflow: false, clippedBy: null, contrast: 12, allowed: [], reasons: [], ...over,
});
const report = (frame: number, over: Partial<ProbeReport> = {}): ProbeReport => ({ frame, width: 1280, height: 720, expects: [], texts: [], overlaps: [], ...over });
const run = (reports: ProbeReport[], extra: Partial<Parameters<typeof analyze>[0]> = {}) =>
  analyze({ reports, fps: 30, stepFrames: 15, rules: DEFAULT_RULES, layout, scenesWithColumn: new Set(["s"]), accepted: [], ...extra }).findings;

describe("analyze", () => {
  it("rien sur une image propre", () => expect(run([report(0, { texts: [text({})] })])).toEqual([]));

  it("attente visible non tenue : cause et erreur", () => {
    const f = run([report(10, { expects: [{ id: "x", scene: "s", visible: [0, 20], hidden: null, present: true, box: { x: 0, y: 0, w: 10, h: 10 }, inFrame: 1, shown: 0.6, opacity: 1, clippedBy: null, clippedShare: 0, coveredBy: "#bandeau", coveredShare: 0.4, related: [] }] })]);
    expect(f[0]).toMatchObject({ check: "attente", level: "erreur" });
    expect(f[0].cause).toMatch(/recouvert par #bandeau \(40 %\)/);
  });

  it("attente hors de son intervalle : rien", () => {
    expect(run([report(30, { expects: [{ id: "x", scene: "s", visible: [0, 20], hidden: null, present: false, box: null, inFrame: 0, shown: 0, opacity: 0, clippedBy: null, clippedShare: 0, coveredBy: null, coveredShare: 0, related: [] }] })])).toEqual([]);
  });

  it("identifiant d'attente en double", () => {
    const e = (scene: string) => ({ id: "x", scene, visible: null, hidden: null, present: true, box: null, inFrame: 1, shown: 1, opacity: 1, clippedBy: null, clippedShare: 0, coveredBy: null, coveredShare: 0, related: [] });
    const f = run([report(0, { expects: [e("a")] }), report(40, { expects: [e("b")] })]);
    expect(f.some((x) => x.check === "attente" && /double/.test(x.cause))).toBe(true);
  });

  it("petit texte en avertissement, accepté par Allow", () => {
    expect(run([report(0, { texts: [text({ fontPx: 10 })] })])[0]).toMatchObject({ check: "petit-texte", level: "avertissement" });
    expect(run([report(0, { texts: [text({ fontPx: 10, allowed: ["petit-texte"], reasons: ["détail"] })] })])[0]).toMatchObject({ level: "accepté", reason: "détail" });
  });

  it("Allow ne peut pas accepter une attente", () => {
    const f = run([report(10, { expects: [{ id: "x", scene: "s", visible: [0, 20], hidden: null, present: false, box: null, inFrame: 0, shown: 0, opacity: 0, clippedBy: null, clippedShare: 0, coveredBy: null, coveredShare: 0, related: [] }] })]);
    expect(f[0].level).toBe("erreur");
  });

  it("contraste : seuil abaissé pour un grand texte", () => {
    expect(run([report(0, { texts: [text({ contrast: 3.5, fontPx: 32 })] })])).toEqual([]);
    expect(run([report(0, { texts: [text({ contrast: 3.5, fontPx: 16 })] })]).map((f) => f.check)).toContain("contraste");
  });

  it("zone : texte hors colonne et hors scène", () => {
    expect(run([report(0, { texts: [text({ box: { x: 400, y: 680, w: 200, h: 30 } })] })])[0].check).toBe("zone");
  });

  it("zone : rien sans colonne de texte", () => {
    const { textColumn: _drop, ...noColumn } = layout;
    void _drop;
    expect(run([report(0, { texts: [text({ box: { x: 400, y: 680, w: 200, h: 30 } })] })], { layout: noColumn })).toEqual([]);
  });

  it("lecture : trop court, et texte tapé ignoré", () => {
    const line = (frame: number) => report(frame, { texts: [text({ key: "s|p|Une ligne de sept mots à lire", text: "Une ligne de sept mots à lire", words: 7, column: true })] });
    expect(run([line(0), line(15)]).find((f) => f.check === "lecture")).toBeDefined();
    const typing = ["Rap", "Rappeler le", "Rappeler le fournisseur"].map((t, i) => report(i * 15, { texts: [text({ key: `s|p|${t}`, text: t, words: t.split(" ").length })] }));
    expect(run(typing).filter((f) => f.check === "lecture")).toEqual([]);
  });

  it("un seul signalement par identifiant, avec le nombre d'images", () => {
    const f = run([0, 15, 30].map((fr) => report(fr, { texts: [text({ fontPx: 10 })] })));
    expect(f).toHaveLength(1);
    expect(f[0].frame).toBe(0);
    expect(f[0].cause).toMatch(/vu sur 3 images/);
  });

  it("un texte en train de se taper ne donne qu'un signalement par contrôle, au nom du texte complet", () => {
    const typing = ["Rap", "Rappeler le", "Rappeler le fournisseur"].map((t, i) => report(i * 15, { texts: [text({ key: `s|p|${t}`, text: t, words: t.split(" ").length, fontPx: 10 })] }));
    const f = run(typing).filter((x) => x.check === "petit-texte");
    expect(f).toHaveLength(1);
    expect(f[0].element.text).toBe("Rappeler le fournisseur");
    expect(f[0].cause).toMatch(/vu sur 3 images/);
  });

  it("un petit texte stable reste signalé, même à côté d'un texte qui le prolonge", () => {
    const both = [0, 15].map((fr) => report(fr, { texts: [text({ key: "s|p|Oui", text: "Oui", fontPx: 10 }), text({ key: "s|p|Oui, bien sûr", text: "Oui, bien sûr", words: 3, fontPx: 10 })] }));
    const f = run(both).filter((x) => x.check === "petit-texte");
    expect(f.map((x) => x.element.text).sort()).toEqual(["Oui", "Oui, bien sûr"]);
  });

  it("acceptation par fichier, et orpheline", () => {
    const id = findingId("petit-texte", "s", "p|Bonjour");
    const acc = [{ id, check: "petit-texte", scene: "s", element: "p|Bonjour", reason: "voulu", date: "2026-09-30" }];
    expect(run([report(0, { texts: [text({ fontPx: 10 })] })], { accepted: acc })[0]).toMatchObject({ level: "accepté", reason: "voulu" });
    expect(run([report(0, { texts: [text({})] })], { accepted: acc })[0]).toMatchObject({ check: "acceptation", level: "avertissement" });
  });

  it("l'identifiant ne dépend pas de l'image (scène décalée d'une mesure)", () => {
    const a = run([report(0, { texts: [text({ fontPx: 10 })] })])[0].id;
    const b = run([report(66, { texts: [text({ fontPx: 10 })] })])[0].id;
    expect(a).toBe(b);
  });

  it("sévérité réglée par rules.md", () => {
    const rules = { ...DEFAULT_RULES, levels: { ...DEFAULT_RULES.levels, "petit-texte": "ignoré" as const } };
    expect(run([report(0, { texts: [text({ fontPx: 10 })] })], { rules })).toEqual([]);
  });
});
