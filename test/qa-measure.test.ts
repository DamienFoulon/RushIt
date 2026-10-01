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

describe("mesure, cas fins", () => {
  it("contraste d'un texte sur son propre fond", () => expect(text("#badge").contrast!).toBeGreaterThan(15));
});
