import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { readCatalog } from "../tools/music";

const music = (dir: string, ...args: string[]) =>
  execFileSync("npx", ["tsx", "tools/music.ts", ...args.slice(0, 1), "--dir", dir, ...args.slice(1)], { encoding: "utf8" });

/** The JSON error a failing command writes on stdout (the command line alone must not satisfy the test). */
const failure = (dir: string, ...args: string[]) => {
  const r = spawnSync("npx", ["tsx", "tools/music.ts", ...args.slice(0, 1), "--dir", dir, ...args.slice(1), "--json"], { encoding: "utf8" });
  expect(r.status).toBe(1);
  return (JSON.parse(r.stdout) as { ok: false; error: string }).error;
};

const videoMin = () => {
  const dir = mkdtempSync(path.join(tmpdir(), "rushit-music-"));
  cpSync("test/fixtures/video-min", dir, { recursive: true });
  return dir;
};

/** A video whose music has a known grid: a beat every half second, a bar every two seconds. */
const withGrid = (grid: { beats?: number[]; downbeats: number[] }) => {
  const dir = videoMin();
  const file = path.join(dir, "video.json");
  const video = JSON.parse(readFileSync(file, "utf8"));
  video.music = {
    file: "audio/grille.mp3", title: "Grille", artist: "test", licence: "CC0", credit: "", creditRequired: false,
    pageUrl: "", bpm: 120, segments: [[0, 8]], outputDuration: 8, ...grid,
  };
  writeFileSync(file, JSON.stringify(video));
  return dir;
};
const beats = Array.from({ length: 16 }, (_, i) => i * 0.5);
const downbeatsOf = (dir: string) => JSON.parse(readFileSync(path.join(dir, "video.json"), "utf8")).music.downbeats;

describe("catalogue", () => {
  it("contient les sept morceaux, sans fichier audio", () => {
    const c = readCatalog();
    expect(c).toHaveLength(7);
    expect(c.every((e) => e.pageUrl.startsWith("https://"))).toBe(true);
  });
});

describe("music add", () => {
  it("refuse un fichier qui n'existe pas en le nommant", () => {
    expect(failure(videoMin(), "add", "absent.mp3")).toMatch(/absent\.mp3/);
  });
});

describe("music shift", () => {
  it("décale les premiers temps d'un temps", () => {
    const dir = withGrid({ beats, downbeats: [0, 2, 4, 6] });
    music(dir, "shift", "--beats", "1", "--json");
    expect(downbeatsOf(dir)).toEqual([0.5, 2.5, 4.5, 6.5]);
  });

  it("recule d'un temps avec un nombre négatif", () => {
    const dir = withGrid({ beats, downbeats: [0, 2, 4, 6] });
    music(dir, "shift", "--beats", "-1", "--json");
    expect(downbeatsOf(dir)).toEqual([1.5, 3.5, 5.5, 7.5]);
  });

  it("ne change rien pour quatre temps, une mesure", () => {
    const dir = withGrid({ beats, downbeats: [0, 2, 4, 6] });
    music(dir, "shift", "--beats", "4", "--json");
    expect(downbeatsOf(dir)).toEqual([0, 2, 4, 6]);
  });

  it("nomme --beats quand l'option manque", () => {
    const dir = withGrid({ beats, downbeats: [0, 2, 4, 6] });
    expect(failure(dir, "shift")).toMatch(/--beats/);
  });

  it("demande de relancer music add quand les temps ne sont pas enregistrés", () => {
    const dir = withGrid({ downbeats: [0, 2, 4, 6] });
    expect(failure(dir, "shift", "--beats", "1")).toMatch(/relancer npm run music -- add/);
  });
});
