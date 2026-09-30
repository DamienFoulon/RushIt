import { describe, expect, it } from "vitest";
import { correctOffbeat, harmonyChange, normalizedSum, pickDownbeatPhase } from "../tools/music/downbeats";
import { proposeEdit, toOutputDownbeats } from "../tools/music/edit";

describe("pickDownbeatPhase", () => {
  it("choisit la phase dont les temps portent le plus d'attaque", () => {
    const beats = Array.from({ length: 16 }, (_, i) => i * 0.5);
    const strengthAt = (t: number) => (Math.round(t / 0.5) % 4 === 2 ? 1 : 0.2);
    expect(pickDownbeatPhase(beats, strengthAt)).toBe(2);
  });
});

describe("correctOffbeat", () => {
  const beats = Array.from({ length: 16 }, (_, i) => 1 + i * 0.5);
  const onHalf = (t: number) => (Math.abs((t - 1) / 0.5 - Math.round((t - 1) / 0.5)) > 0.25 ? 1 : 0.2);

  it("décale tous les temps d'une demi-pulsation quand les demi-positions frappent nettement plus fort", () => {
    const r = correctOffbeat(beats, onHalf);
    expect(r.shifted).toBe(true);
    expect(r.beats).toHaveLength(beats.length);
    expect(r.beats[0]).toBeCloseTo(1.25);
    expect(r.beats.at(-1)).toBeCloseTo(8.75);
  });

  it("garde les temps quand ils portent déjà l'attaque", () => {
    const r = correctOffbeat(beats, (t) => 1.2 - onHalf(t));
    expect(r).toEqual({ beats, shifted: false });
  });

  it("garde les temps quand la différence n'est pas nette", () => {
    const r = correctOffbeat(beats, (t) => (onHalf(t) === 1 ? 1.1 : 1));
    expect(r.shifted).toBe(false);
  });
});

describe("harmonyChange", () => {
  const c = (k: number) => Array.from({ length: 12 }, (_, j) => (j === k ? 1 : 0));

  it("mesure l'écart d'harmonie entre la mesure qui commence et la précédente", () => {
    const chromas = [c(0), c(0), c(0), c(0), c(7), c(7), c(7), c(7)];
    expect(harmonyChange(chromas, 4)).toBeCloseTo(Math.SQRT2);
    expect(harmonyChange(chromas, 2)).toBeLessThan(harmonyChange(chromas, 4));
  });

  it("vaut zéro quand il n'y a pas de mesure précédente", () => {
    expect(harmonyChange([c(0), c(1), c(2), c(3), c(4)], 3)).toBe(0);
  });
});

describe("normalizedSum", () => {
  it("additionne des mesures d'échelles différentes, chacune rapportée à sa moyenne", () => {
    const beats = [0, 1, 2, 3];
    const big = (t: number) => (t === 1 ? 300 : 100);
    const small = (t: number) => (t === 2 ? 0.4 : 0.1);
    const f = normalizedSum(beats, [big, small]);
    expect(f(1)).toBeCloseTo(300 / 150 + 0.1 / 0.175);
    expect(f(2)).toBeCloseTo(100 / 150 + 0.4 / 0.175);
    expect(f(0)).toBeLessThan(f(2));
  });
});

describe("proposeEdit", () => {
  const downbeats = Array.from({ length: 60 }, (_, i) => i * 2);
  const flat = () => 0;

  it("garde le morceau entier quand il tient dans la cible", () => {
    expect(proposeEdit({ downbeats, duration: 20, target: 30, distance: flat }).segments).toEqual([[0, 20]]);
  });

  it("prévient sans boucler quand le morceau est plus court que la cible", () => {
    const r = proposeEdit({ downbeats, duration: 20, target: 60, distance: flat });
    expect(r.segments).toEqual([[0, 20]]);
    expect(r.warning).toMatch(/plus court/);
  });

  it("coupe sur des premiers temps pour que la fin tombe sur la cible, à une demi-mesure près", () => {
    const r = proposeEdit({ downbeats, duration: 118, target: 40, distance: flat });
    expect(r.segments).toHaveLength(2);
    const [[a0, a1], [b0, b1]] = r.segments;
    expect(a0).toBe(0);
    expect(downbeats).toContain(a1);
    expect(downbeats).toContain(b0);
    expect(b1).toBe(118);
    expect(Math.abs(a1 - a0 + (b1 - b0) - 40)).toBeLessThanOrEqual(1);
  });

  it("préfère le raccord dont les deux côtés se ressemblent", () => {
    const distance = (a: number, b: number) => (a === 20 && b === 98 ? 0 : 1);
    const r = proposeEdit({ downbeats, duration: 118, target: 40, distance });
    expect(r.segments).toEqual([[0, 20], [98, 118]]);
  });
});

describe("proposeEdit, seuils mesurés sur la grille", () => {
  // Bars of 4 s: half a bar is 2 s, not the 1 s a default bar of 2 s would give.
  const downbeats = Array.from({ length: 30 }, (_, i) => i * 4);
  const flat = () => 0;

  it("prévient quand le morceau est plus court que la cible de plus d'une demi-mesure", () => {
    const r = proposeEdit({ downbeats, duration: 27.9, target: 30, distance: flat });
    expect(r.segments).toEqual([[0, 27.9]]);
    expect(r.warning).toMatch(/plus court/);
  });

  it("garde le morceau entier sans prévenir quand il manque moins d'une demi-mesure", () => {
    expect(proposeEdit({ downbeats, duration: 28.1, target: 30, distance: flat })).toEqual({ segments: [[0, 28.1]] });
    expect(proposeEdit({ downbeats, duration: 28, target: 30, distance: flat }).warning).toBeUndefined();
  });

  it("garde le morceau entier sans prévenir quand il tient la cible à une demi-mesure près", () => {
    for (const duration of [30, 31.9, 32]) {
      const r = proposeEdit({ downbeats, duration, target: 30, distance: flat });
      expect(r.segments).toEqual([[0, duration]]);
      expect(r.warning).toBeUndefined();
    }
  });
});

describe("proposeEdit, intro d'au moins un tiers de la cible", () => {
  const downbeats = Array.from({ length: 60 }, (_, i) => i * 2);

  it("écarte un raccord avant le tiers de la cible, même s'il est le plus ressemblant", () => {
    // Target 30: the intro must last 10 s. A join at 4 s would sound best, one at 10 s comes next.
    const distance = (a: number, b: number) => (a === 4 && b === 74 ? 0 : a === 10 && b === 80 ? 0.5 : 1);
    expect(proposeEdit({ downbeats, duration: 100, target: 30, distance })).toEqual({ segments: [[0, 10], [80, 100]] });
  });
});

describe("toOutputDownbeats", () => {
  it("recalcule la grille après le montage", () => {
    expect(toOutputDownbeats([0, 2, 4, 96, 98, 100], [[0, 4], [96, 100]])).toEqual([0, 2, 4, 6]);
  });

  it("compte depuis le début du premier segment quand il ne commence pas à zéro", () => {
    expect(toOutputDownbeats([0, 2, 4, 6, 8, 50, 52, 54], [[2, 6], [50, 54]])).toEqual([0, 2, 4, 6]);
  });
});
