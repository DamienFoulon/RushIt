import { describe, expect, it } from "vitest";
import { at, progress, shotAt, typed } from "../kit/motion";

describe("motion", () => {
  it("at convertit des temps en images, arrondi", () => expect(at(16.67, 2.5)).toBe(42));
  it("progress va de 0 à 1 et reste borné", () => {
    expect(progress(0, 10, 20)).toBe(0);
    expect(progress(30, 10, 20)).toBe(1);
  });
  it("typed tape un caractère toutes les 2 images", () => expect(typed("Bonjour", 14, 10, 2)).toBe("Bo"));
  it("typed n'affiche un caractère qu'une fois ses images écoulées", () => expect(typed("Bonjour", 15, 10, 2)).toBe("Bo"));
  it("shotAt interpole entre deux plans et tient le dernier", () => {
    const shots = [
      { at: 0, x: 0, y: 0, zoom: 1 },
      { at: 10, x: 100, y: 50, zoom: 2 },
    ];
    expect(shotAt(shots, 10)).toEqual({ at: 10, x: 100, y: 50, zoom: 2 });
    expect(shotAt(shots, 99).x).toBe(100);
    const mid = shotAt(shots, 5, (t) => t);
    expect(mid.x).toBeCloseTo(50);
  });
});
