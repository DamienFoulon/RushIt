import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { ProbeReport } from "../kit/qa/types";
import { openSession, type Session } from "../tools/qa/stills";

let session: Session;
let reports: Map<number, ProbeReport>;
const at = (sceneIndex: number) => sceneIndex * 30 + 15;

beforeAll(async () => {
  session = await openSession(path.resolve("test/fixtures/qa-defects"));
  const frames = Array.from({ length: 12 }, (_, i) => at(i));
  const out = mkdtempSync(path.join(tmpdir(), "rushit-qa-"));
  reports = new Map((await session.render(frames, out)).map((r) => [r.frame, r]));
}, 300_000);
afterAll(() => session?.close());

const expectFact = (i: number, id: string) => reports.get(at(i))!.expects.find((e) => e.id === id)!;

describe("mesure dans la page", () => {
  it("rapporte chaque image demandée", () => expect(reports.size).toBe(12));
  it("voit le chevauchement", () => expect(reports.get(at(0))!.overlaps.length).toBeGreaterThan(0));
  it("voit le texte coupé", () => expect(reports.get(at(1))!.texts.some((t) => t.overflow || t.clippedBy)).toBe(true));
  it("voit le texte hors cadre", () => expect(reports.get(at(2))!.texts.some((t) => t.inFrame < 0.9)).toBe(true));
  it("voit l'élément rogné et par qui", () => {
    const e = expectFact(3, "rogne");
    expect(e.clippedShare).toBeGreaterThan(0.2);
    expect(e.clippedBy).not.toBeNull();
  });
  it("voit l'élément recouvert dans un parent tourné", () => {
    const e = expectFact(4, "couvert");
    expect(e.coveredShare).toBeGreaterThan(0.2);
    expect(e.coveredBy).not.toBeNull();
  });
  it("voit l'opacité héritée", () => expect(expectFact(5, "pale").opacity).toBeCloseTo(0.3, 1));
  it("voit la taille à l'écran sous transformation", () => {
    const t = reports.get(at(6))!.texts.find((x) => x.text.startsWith("Minuscule"))!;
    expect(t.fontPx).toBeCloseTo(10, 0);
  });
  it("voit l'élément censé être caché", () => expect(expectFact(7, "cache").shown).toBeGreaterThan(0.9));
  it("voit l'attente sans contenu", () => expect(expectFact(8, "absent").present).toBe(false));
  it("mesure le contraste", () => {
    const t = reports.get(at(9))!.texts.find((x) => x.text.startsWith("Contraste"))!;
    expect(t.contrast!).toBeLessThan(2);
  });
  it("marque les lignes de colonne et les exceptions", () => {
    expect(reports.get(at(10))!.texts.some((t) => t.column)).toBe(true);
    const clean = reports.get(at(11))!;
    expect(clean.texts.find((t) => t.text === "Détail accepté")!.allowed).toContain("petit-texte");
    expect(clean.overlaps.every((o) => !o.a.includes("Superposition") && !o.b.includes("Superposition"))).toBe(true);
  });
  it("attribue chaque fait à sa scène et donne les bornes absolues", () => {
    const e = expectFact(3, "rogne");
    expect(e.scene).toBe("rogne");
    expect(e.visible).toEqual([90, 119]);
  });
});
