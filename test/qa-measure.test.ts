import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { ProbeReport } from "../kit/qa/types";
import { openSession, type Session } from "../tools/qa/stills";
import { tempDirs } from "./helpers/tmp";

const tmp = tempDirs("rushit-measure-");

let session: Session;
let reports: Map<number, ProbeReport>;
const TEXTS = 15;
const BLOCKS = 45;
const EDGE = 75;

beforeAll(async () => {
  session = await openSession(path.resolve("test/fixtures/qa-measure"));
  reports = new Map((await session.render([TEXTS, BLOCKS, EDGE], tmp())).map((r) => [r.frame, r]));
}, 300_000);
afterAll(() => session?.close());

const text = (selector: string) => reports.get(TEXTS)!.texts.find((t) => t.selector === selector)!;
const block = (id: string) => reports.get(BLOCKS)!.expects.find((e) => e.id === id)!;

describe("mesure, cas fins", () => {
  it("contraste d'un texte sur son propre fond", () => expect(text("#badge").contrast!).toBeGreaterThan(15));
  it("un fond opaque cache le dégradé qui est dessous", () => expect(text("#sur-uni").contrast!).toBeGreaterThan(15));
  it("le contraste se lit sous le texte, pas sur le calque qui le recouvre", () => expect(text("#sous-voile").contrast!).toBeGreaterThan(15));
  it("contraste d'un texte pâle par opacité héritée", () => expect(text("#pale-texte").contrast!).toBeLessThan(3));
  it("gras dès 700", () => expect(text("#gras").bold).toBe(true));
  it("taille à l'écran sous une échelle inégale : la plus petite", () => expect(text("#ecrase").fontPx).toBeCloseTo(8, 0));
  it("un texte qui déborde de peu de son propre bloc est coupé par lui", () => {
    expect(text("#deborde").overflow).toBe(true);
    expect(text("#deborde").clippedBy).toBe("#deborde");
  });
  it("un petit recouvrement compte, un texte et le texte qu'il contient non", () => {
    const o = reports.get(TEXTS)!.overlaps;
    expect(o.map((x) => [x.a.split("|")[1], x.b.split("|")[1]])).toEqual([["#frole-a", "#frole-b"]]);
    expect(o[0].area).toBeLessThan(400);
  });
  it("un calque transparent ou invisible ne recouvre pas", () => {
    expect(block("sous-vitre")).toMatchObject({ shown: 1, coveredBy: null });
    expect(block("sous-fantome")).toMatchObject({ shown: 1, coveredBy: null });
  });
  it("opacité : celle du contenu, nulle s'il est masqué ou retiré", () => {
    expect(block("demi").opacity).toBe(0.5);
    expect(block("invisible").opacity).toBe(0);
    expect(block("demi-et-retire").opacity).toBe(0.5);
  });
  it("clip-path rogne, et le rognage est attribué à la boîte qui coupe", () => {
    expect(block("decoupe").clippedShare).toBeCloseTo(0.6, 1);
    expect(block("emboite").clippedBy).toBe("#exterieur");
  });
  it("marge prise au bord de l'image quand la boîte qui rogne en sort", () =>
    expect(reports.get(EDGE)!.texts.find((t) => t.text === "Au bord de l'image")!.margin).toBe(8));
});
