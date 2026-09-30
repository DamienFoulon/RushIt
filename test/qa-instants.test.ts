import { describe, expect, it } from "vitest";
import { boundFrames, sampleFrames } from "../tools/qa/instants";

const timed = [
  { id: "a", from: 0, durationInFrames: 60, textsAt: [0, 30] },
  { id: "b", from: 60, durationInFrames: 60, textsAt: [0] },
];

describe("sampleFrames", () => {
  const frames = sampleFrames({ timed, fps: 30, totalFrames: 120, stepSeconds: 0.5 });
  it("contient les coupes, 3 images après et avant", () => {
    for (const f of [3, 56, 63, 116]) expect(frames).toContain(f);
  });
  it("contient chaque ligne posée (apparition + 12)", () => {
    for (const f of [12, 42, 72]) expect(frames).toContain(f);
  });
  it("contient une image toutes les 0,5 s", () => {
    for (const f of [0, 15, 30, 45, 60, 75, 90, 105]) expect(frames).toContain(f);
  });
  it("est triée, unique, dans la vidéo", () => {
    expect([...frames].sort((x, y) => x - y)).toEqual(frames);
    expect(new Set(frames).size).toBe(frames.length);
    expect(Math.max(...frames)).toBeLessThan(120);
  });
  it("se limite à une scène avec --scene", () => {
    const only = sampleFrames({ timed, fps: 30, totalFrames: 120, stepSeconds: 0.5, scene: "b" });
    expect(Math.min(...only)).toBeGreaterThanOrEqual(60);
  });
  it("--scene borne les instants au début et à la fin de la scène", () => {
    // A line that settles after its scene ends (55 + 12 > 60) stays out of it.
    const three = [timed[0], { ...timed[1], textsAt: [0, 55] }, { id: "c", from: 120, durationInFrames: 60, textsAt: [0] }];
    const only = sampleFrames({ timed: three, fps: 30, totalFrames: 180, stepSeconds: 0.5, scene: "b" });
    expect(only).toEqual([60, 63, 72, 75, 90, 105, 116]);
    const first = sampleFrames({ timed: three, fps: 30, totalFrames: 180, stepSeconds: 0.5, scene: "a" });
    expect(first).toEqual([0, 3, 12, 15, 30, 42, 45, 56]);
  });
  it("refuse une scène inconnue", () => {
    expect(() => sampleFrames({ timed, fps: 30, totalFrames: 120, stepSeconds: 0.5, scene: "z" })).toThrow(/Scène inconnue : z/);
  });
});

describe("boundFrames", () => {
  it("ajoute les bornes absentes, dans l'intervalle", () => {
    expect(boundFrames([[10, 40], [70, 200]], new Set([10]), [0, 119])).toEqual([40, 70, 119]);
  });
});
