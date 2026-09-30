import { describe, expect, it } from "vitest";
import type { ExpectFact, ProbeReport, TextFact } from "../kit/qa/types";
import { analyze } from "../tools/qa/analyze";
import { findingId } from "../tools/qa/ids";
import { DEFAULT_RULES } from "../tools/qa/rules";

const layout = { textColumn: { left: 40, width: 360 }, stage: { left: 440, top: 60, width: 800, height: 600 }, window: { width: 800, height: 600 } };
const text = (over: Partial<TextFact>): TextFact => ({
  key: "s|p|Bonjour", scene: "s", selector: "p", text: "Bonjour", words: 1, column: false,
  box: { x: 500, y: 100, w: 200, h: 40 }, inFrame: 1, opacity: 1, fontPx: 32, bold: false,
  overflow: false, clippedBy: null, margin: 100, contrast: 12, allowed: [], reasons: [], ...over,
});
const expectFact = (over: Partial<ExpectFact>): ExpectFact => ({
  id: "x", scene: "s", visible: null, hidden: null, present: true, box: { x: 500, y: 100, w: 100, h: 40 }, inFrame: 1, shown: 1,
  opacity: 1, clippedBy: null, clippedShare: 0, coveredBy: null, coveredShare: 0, related: [], ...over,
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

  it("marge : texte trop près du bord de sa fenêtre", () => {
    const f = run([report(0, { texts: [text({ margin: 10 })] })]);
    expect(f).toHaveLength(1);
    expect(f[0]).toMatchObject({ check: "marge", level: "avertissement" });
    expect(f[0].cause).toMatch(/à 10 px du bord de sa fenêtre \(minimum 32\)/);
    expect(run([report(0, { texts: [text({ margin: 40 })] })])).toEqual([]);
  });

  it("marge : rien pour une ligne de colonne, ni pour un texte entièrement hors cadre", () => {
    expect(run([report(0, { texts: [text({ margin: 10, column: true, box: { x: 40, y: 100, w: 300, h: 40 } })] })])).toEqual([]);
    expect(run([report(0, { texts: [text({ margin: -300, inFrame: 0 })] })]).map((f) => f.check)).toEqual(["hors-cadre"]);
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

describe("analyze : acceptations et doublons", () => {
  it("une attente inscrite à la main dans accepted.json reste une erreur", () => {
    const id = findingId("attente", "s", "expect:x");
    const acc = [{ id, check: "attente", scene: "s", element: "[data-rushit-expect=x]|", reason: "voulu", date: "2026-09-30" }];
    const f = run([report(10, { expects: [expectFact({ visible: [0, 20], present: false })] })], { accepted: acc });
    expect(f).toHaveLength(1);
    expect(f[0]).toMatchObject({ id, check: "attente", level: "erreur" });
    expect(f[0].reason).toBeUndefined();
  });

  it("identifiant d'attente en double dans une même scène", () => {
    const f = run([report(0, { expects: [expectFact({}), expectFact({ box: { x: 700, y: 100, w: 100, h: 40 } })] })]);
    expect(f).toHaveLength(1);
    expect(f[0]).toMatchObject({ check: "attente", level: "erreur" });
    expect(f[0].cause).toMatch(/identifiant en double : x$/);
  });
});

describe("analyze : seuils de rules.md", () => {
  const strict = { ...DEFAULT_RULES, minTextPx: 40, minMarginPx: 80, minContrast: 7, secondsPerWord: 1 };
  const checks = (reports: ProbeReport[], rules = DEFAULT_RULES) => run(reports, { rules }).map((f) => f.check);

  it("taille de texte minimale", () => {
    const r = [report(0, { texts: [text({ fontPx: 32 })] })];
    expect(checks(r)).toEqual([]);
    expect(checks(r, strict)).toEqual(["petit-texte"]);
    expect(run(r, { rules: strict })[0].cause).toMatch(/minimum 40/);
  });

  it("marge minimale", () => {
    const r = [report(0, { texts: [text({ margin: 60, fontPx: 48 })] })];
    expect(checks(r)).toEqual([]);
    expect(checks(r, strict)).toEqual(["marge"]);
  });

  it("contraste minimal", () => {
    const r = [report(0, { texts: [text({ fontPx: 20, contrast: 5 })] })];
    expect(checks(r)).not.toContain("contraste");
    expect(checks(r, strict)).toContain("contraste");
  });

  it("temps de lecture par mot", () => {
    const line = (frame: number) => report(frame, { texts: [text({ key: "s|p|Trois mots ici", text: "Trois mots ici", words: 3, column: true, box: { x: 40, y: 100, w: 300, h: 40 } })] });
    const r = [0, 15, 30, 45].map(line);
    expect(checks(r)).not.toContain("lecture");
    expect(checks(r, strict)).toContain("lecture");
  });
});

describe("analyze : bornes des contrôles", () => {
  const at = (e: Partial<ExpectFact>) => run([report(10, { expects: [expectFact(e)] })]);

  it("attente visible : tenue dès 95 % d'opacité et 90 % montrés", () => {
    expect(at({ visible: [0, 20], opacity: 0.95 })).toEqual([]);
    expect(at({ visible: [0, 20], opacity: 0.94 })[0].cause).toMatch(/transparent/);
    expect(at({ visible: [0, 20], shown: 0.9 })).toEqual([]);
    expect(at({ visible: [0, 20], shown: 0.89 })).toHaveLength(1);
  });

  it("attente cachée : visible dès 5 % d'opacité", () => {
    expect(at({ hidden: [0, 20], opacity: 0.05 })[0].cause).toMatch(/doit être caché/);
    expect(at({ hidden: [0, 20], opacity: 0.04 })).toEqual([]);
    expect(at({ hidden: [0, 20], shown: 0 })).toEqual([]);
    expect(at({ hidden: [0, 20], present: false })).toEqual([]);
  });

  it("hors-cadre dès plus de 10 % hors de l'image", () => {
    expect(run([report(0, { texts: [text({ inFrame: 0.9 })] })])).toEqual([]);
    expect(run([report(0, { texts: [text({ inFrame: 0.89 })] })]).map((f) => f.check)).toEqual(["hors-cadre"]);
  });

  it("contraste 3:1 pour un texte gras d'au moins 18,66 px, 4,5:1 en dessous ou sans gras", () => {
    const contrast = (over: Partial<TextFact>) => run([report(0, { texts: [text({ contrast: 3.5, ...over })] })]).map((f) => f.check).includes("contraste");
    expect(contrast({ bold: true, fontPx: 18.66 })).toBe(false);
    expect(contrast({ bold: true, fontPx: 18.6 })).toBe(true);
    expect(contrast({ bold: false, fontPx: 18.66 })).toBe(true);
    expect(contrast({ bold: false, fontPx: 24 })).toBe(false);
  });

  it("zone : seulement pour une scène qui a une colonne, et pas pour une ligne de colonne", () => {
    const out = text({ box: { x: 400, y: 680, w: 200, h: 30 } });
    expect(run([report(0, { texts: [out] })]).map((f) => f.check)).toEqual(["zone"]);
    expect(run([report(0, { texts: [out] })], { scenesWithColumn: new Set(["autre"]) })).toEqual([]);
    expect(run([report(0, { texts: [{ ...out, column: true }] })])).toEqual([]);
  });

  const line = (frame: number, over: Partial<TextFact> = {}) =>
    report(frame, { texts: [text({ key: "s|p|Une ligne de sept mots à lire", text: "Une ligne de sept mots à lire", words: 7, column: true, box: { x: 40, y: 100, w: 300, h: 40 }, ...over })] });

  it("lecture : mesurée sur les échantillons réguliers seulement", () => {
    expect(run([line(0), line(7), line(15)]).map((f) => f.check)).toEqual(["lecture"]);
  });

  it("lecture : une ligne ne compte comme posée qu'à 95 % d'opacité", () => {
    expect(run([line(0, { opacity: 0.94 }), line(15, { opacity: 0.94 })])).toEqual([]);
    expect(run([line(0, { opacity: 0.95 }), line(15, { opacity: 0.95 })]).map((f) => f.check)).toEqual(["lecture"]);
  });

  it("un préfixe commun à deux textes tapés n'est rattaché à aucun", () => {
    const typing = ["Rap", "Rappeler", "Rapport"].map((t, i) => report(i * 15, { texts: [text({ key: `s|p|${t}`, text: t, fontPx: 10 })] }));
    expect(run(typing).map((f) => f.element.text).sort()).toEqual(["Rap", "Rappeler", "Rapport"]);
  });

  it("trie les erreurs, puis les avertissements, puis les acceptés, chacun par image", () => {
    const small = (t: string, over: Partial<TextFact> = {}) => text({ key: `s|p|${t}`, text: t, fontPx: 10, ...over });
    const f = run([
      report(0, { texts: [small("Accepté", { allowed: ["petit-texte"], reasons: ["voulu"] })] }),
      report(5, { texts: [small("Tard")] }),
      report(3, { texts: [small("Tôt")] }),
      report(9, { texts: [text({ key: "s|p|Coupé", text: "Coupé", overflow: true })] }),
    ], { accepted: [{ id: "00000000", check: "petit-texte", scene: "s", element: "p|Parti", reason: "voulu", date: "2026-09-30" }] });
    // The orphan acceptation comes last out of the analysis, at frame 0: the sort puts it first among the warnings.
    expect(f.map((x) => [x.level, x.frame, x.check])).toEqual([
      ["erreur", 9, "coupe"], ["avertissement", 0, "acceptation"], ["avertissement", 3, "petit-texte"],
      ["avertissement", 5, "petit-texte"], ["accepté", 0, "petit-texte"],
    ]);
  });
});
