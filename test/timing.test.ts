import { describe, expect, it } from "vitest";
import { framesPerBeat, snapToDownbeat, timeScenes } from "../kit/timing";

const grid = { downbeats: [0, 2, 4, 6, 8], outputDuration: 10 };
const scenes = [
  { id: "a", at: 0, texts: ["un", "deux"] },
  { id: "b", at: 4.9, texts: ["trois"] },
];

describe("snapToDownbeat", () => {
  it("prend le premier temps le plus proche", () => expect(snapToDownbeat(grid.downbeats, 4.9)).toBe(4));
  it("rend la cible telle quelle sans grille", () => expect(snapToDownbeat([], 4.9)).toBe(4.9));
});

describe("timeScenes", () => {
  const timed = timeScenes(scenes, grid, 30);
  it("commence la première scène à 0 et finit la dernière avec le morceau", () => {
    expect(timed[0].from).toBe(0);
    expect(timed[1].from + timed[1].durationInFrames).toBe(300);
  });
  it("cale la coupe sur un premier temps", () => expect(timed[1].from).toBe(120));
  it("place la seconde ligne sur le premier temps du milieu de la scène", () => expect(timed[0].textsAt).toEqual([0, 60]));
});

describe("framesPerBeat", () => {
  it("à 120 bpm et 30 i/s, 15 images", () => expect(framesPerBeat(120, 30)).toBe(15));
  it("sans musique, 120 bpm", () => expect(framesPerBeat(undefined, 30)).toBe(15));
});
