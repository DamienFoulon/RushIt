import { describe, expect, it } from "vitest";
import { DEFAULT_RULES, parseQaRules } from "../tools/qa/rules";

const section = (lines: string) => `# Règles\n\n## Seuils de la passe de contrôle\n${lines}\n\n## Autre\n- lecture : 9 s par mot\n`;

describe("parseQaRules", () => {
  it("donne les valeurs neutres sans section", () => {
    expect(parseQaRules("# Règles\n")).toEqual(DEFAULT_RULES);
    expect(DEFAULT_RULES.secondsPerWord).toBe(0.3);
    expect(DEFAULT_RULES.minTextPx).toBe(24);
    expect(DEFAULT_RULES.minContrast).toBe(4.5);
    expect(DEFAULT_RULES.minMarginPx).toBe(32);
    expect(DEFAULT_RULES.levels.marge).toBe("avertissement");
    expect(DEFAULT_RULES.levels.chevauchement).toBe("erreur");
    expect(DEFAULT_RULES.levels.lecture).toBe("avertissement");
  });

  it("lit les seuils, virgule ou point décimal, et seulement dans sa section", () => {
    const r = parseQaRules(section("- lecture : 0,25 s par mot\n- taille de texte minimale : 22 px à l'écran\n- contraste minimal : 3.5"));
    expect(r.secondsPerWord).toBe(0.25);
    expect(r.minTextPx).toBe(22);
    expect(r.minContrast).toBe(3.5);
  });

  it("lit la marge minimale", () => {
    expect(parseQaRules(section("- marge minimale : 48 px")).minMarginPx).toBe(48);
    expect(parseQaRules(section("- sévérité : marge = erreur")).levels.marge).toBe("erreur");
  });

  it("lit les sévérités", () => {
    const r = parseQaRules(section("- sévérité : lecture = erreur, zone = ignoré"));
    expect(r.levels.lecture).toBe("erreur");
    expect(r.levels.zone).toBe("ignoré");
  });

  it("garde attente en erreur et le signale", () => {
    const r = parseQaRules(section("- sévérité : attente = ignoré"));
    expect(r.levels.attente).toBe("erreur");
    expect(r.problems[0]).toMatch(/attente/);
  });

  it("donne à chaque contrôle le niveau par défaut de la spécification", () => {
    expect(DEFAULT_RULES.levels).toEqual({
      attente: "erreur", chevauchement: "erreur", coupe: "erreur", "hors-cadre": "erreur",
      "petit-texte": "avertissement", contraste: "avertissement", lecture: "avertissement", zone: "avertissement",
      marge: "avertissement",
    });
  });

  it("signale une ligne de clé inconnue, sans rien changer", () => {
    const r = parseQaRules(section("- couleur du texte : rouge"));
    expect(r.problems).toEqual(["couleur du texte : rouge"]);
    expect({ ...r, problems: [] }).toEqual(DEFAULT_RULES);
  });

  it("signale une sévérité mal écrite et garde le niveau par défaut, le reste de la ligne s'applique", () => {
    const r = parseQaRules(section("- sévérité : lecture = fort, bavure = erreur, zone = ignoré"));
    expect(r.problems).toEqual(["sévérité : lecture = fort", "sévérité : bavure = erreur"]);
    expect(r.levels.lecture).toBe("avertissement");
    expect(r.levels.zone).toBe("ignoré");
  });

  it("garde la valeur neutre pour une ligne illisible et la signale", () => {
    const r = parseQaRules(section("- lecture : vite"));
    expect(r.secondsPerWord).toBe(0.3);
    expect(r.problems[0]).toMatch(/lecture : vite/);
  });
});
