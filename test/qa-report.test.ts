import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { Finding } from "../tools/qa/analyze";
import { writeReports } from "../tools/qa/report";
import { tempDirs } from "./helpers/tmp";

const tmp = tempDirs("rushit-report-");

const finding = (over: Partial<Finding>): Finding => ({
  id: "abcd1234", level: "erreur", check: "coupe", scene: "s", frame: 10, seconds: 0.33,
  element: { selector: "p", text: "Bonjour" }, cause: "coupé par div", boxes: [{ x: 100, y: 40, w: 200, h: 20 }], ...over,
});

/** A video folder named "demo", with the frames the check rendered, and its reports written. */
const write = (findings: Finding[], opts: { forced?: boolean; problems?: string[]; frames?: number[] } = {}) => {
  const dir = path.join(tmp(), "demo");
  const framesDir = tmp();
  for (const f of opts.frames ?? [10, 20]) writeFileSync(path.join(framesDir, `frame-${f}.png`), `png ${f}`);
  const result = { findings, problems: opts.problems ?? [], errors: 1, warnings: 0, frames: 2, ms: 1500 };
  const out = writeReports(dir, result, { framesDir, forced: opts.forced, stepSeconds: 0.5, rushit: "0.1.0", date: "2026-09-30", width: 1920, height: 1080 });
  return { dir, html: readFileSync(out.reportHtml, "utf8"), json: JSON.parse(readFileSync(out.reportJson, "utf8")) };
};

describe("rapport de la passe", () => {
  it("encadre l'élément à l'échelle de l'image affichée (960 px de large)", () => {
    const { html } = write([finding({ boxes: [{ x: 100, y: 40, w: 200, h: 20 }, { x: 0, y: 0, w: 1920, h: 1080 }] })]);
    // 1920 px shown on 960: everything halves.
    expect(html).toContain('<div class="shot" style="height:540px">');
    expect(html).toContain("left:50px;top:20px;width:100px;height:10px;border-color:#76ff03");
    expect(html).toContain("left:0px;top:0px;width:960px;height:540px;border-color:#ffffff");
  });

  it("copie les images des signalements, et seulement elles", () => {
    const { dir } = write([finding({ frame: 10 }), finding({ id: "orphelin", check: "acceptation", level: "avertissement", frame: 20, boxes: [] })]);
    const frames = path.join(dir, "qa", "frames");
    expect(readdirSync(frames)).toEqual(["frame-10.png"]);
    expect(readFileSync(path.join(frames, "frame-10.png"), "utf8")).toBe("png 10");
  });

  it("repart d'un dossier d'images vide à chaque passe", () => {
    const { dir } = write([finding({ frame: 10 })]);
    const framesDir = tmp();
    writeReports(dir, { findings: [], problems: [], errors: 0, warnings: 0, frames: 1, ms: 1 }, { framesDir, stepSeconds: 0.5, rushit: "0.1.0", date: "2026-09-30", width: 1920, height: 1080 });
    expect(readdirSync(path.join(dir, "qa", "frames"))).toEqual([]);
  });

  it("donne la commande d'acceptation d'un signalement, pas celle d'une attente ni d'un signalement déjà accepté", () => {
    const { html } = write([finding({ id: "abcd1234" }), finding({ id: "ffff0000", check: "attente" }), finding({ id: "acce0000", level: "accepté", reason: "voulu" })]);
    expect(html).toContain('<code>npm run check -- demo --accept abcd1234 --reason "…"</code>');
    expect(html).not.toContain("--accept ffff0000");
    expect(html).not.toContain("--accept acce0000");
    expect(html).toContain("Une attente ne s'accepte pas");
  });

  it("affiche les règles illisibles de rules.md", () => {
    const { html } = write([], { problems: ["seuil : trop <grand>"] });
    expect(html).toContain("<p>Règle illisible dans rules.md : seuil : trop &lt;grand&gt;</p>");
  });

  it("note un rendu forcé, dans les deux rapports", () => {
    const forced = write([finding({})], { forced: true });
    expect(forced.json.forced).toBe(true);
    expect(forced.html).toContain("· rendu forcé");
    const normal = write([finding({})]);
    expect(normal.json.forced).toBe(false);
    expect(normal.html).not.toContain("rendu forcé");
  });
});
