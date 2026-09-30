import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { addAccepted, readAccepted } from "../tools/qa/accepted";
import type { Finding } from "../tools/qa/analyze";
import { tempDirs } from "./helpers/tmp";

const tmp = tempDirs("rushit-accepted-");

const finding = (over: Partial<Finding> = {}): Finding => ({
  id: "a1b2c3d4", level: "avertissement", check: "petit-texte", scene: "s", frame: 0, seconds: 0,
  element: { selector: "p", text: "Bonjour" }, cause: "10 px à l'écran (minimum 24)", boxes: [], ...over,
});

describe("addAccepted", () => {
  it("inscrit le signalement avec sa raison, une seule fois par identifiant", () => {
    const dir = tmp();
    addAccepted(dir, finding(), "voulu", "2026-09-30");
    addAccepted(dir, finding(), "voulu, vraiment", "2026-10-01");
    expect(readAccepted(dir)).toEqual([
      { id: "a1b2c3d4", check: "petit-texte", scene: "s", element: "p|Bonjour", reason: "voulu, vraiment", date: "2026-10-01" },
    ]);
  });

  it("refuse une raison vide ou faite d'espaces, sans rien écrire", () => {
    const dir = tmp();
    expect(() => addAccepted(dir, finding(), "", "2026-09-30")).toThrow(/raison est obligatoire/);
    expect(() => addAccepted(dir, finding(), "   ", "2026-09-30")).toThrow(/raison est obligatoire/);
    expect(existsSync(`${dir}/qa/accepted.json`)).toBe(false);
  });

  it("refuse une attente, même avec une raison, sans rien écrire", () => {
    const dir = tmp();
    const attente = finding({ check: "attente", level: "erreur", element: { selector: "[data-rushit-expect=x]", text: "" } });
    expect(() => addAccepted(dir, attente, "voulu", "2026-09-30")).toThrow(/attente ne s'accepte pas/);
    expect(existsSync(`${dir}/qa/accepted.json`)).toBe(false);
  });
});
