import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fail, output, parseArgs } from "./lib/cli";
import { repoRoot, videoDir } from "./lib/paths";
import { readVideo, writeVideo } from "./lib/video";
import { analyzeTrack } from "./music/analyze";
import { buildEditWav } from "./music/edit-wav";
import { shiftDownbeats } from "./music/edit";

export type CatalogEntry = {
  slug: string; title: string; artist: string; licence: string; credit: string; creditRequired: boolean;
  pageUrl: string; downloadUrl?: string; sha256?: string; segmentsFor?: Record<string, [number, number][]>;
};

export const readCatalog = (): CatalogEntry[] => JSON.parse(readFileSync(path.join(repoRoot, "catalog/music.json"), "utf8"));

export const fetchToFile = async (url: string, file: string, sha256?: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Téléchargement impossible (${res.status}) : ${url}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  const got = createHash("sha256").update(bytes).digest("hex");
  if (sha256 && got !== sha256) throw new Error(`Empreinte inattendue pour ${url} : ${got}`);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, bytes);
};

const USAGE = "Usage : npm run music -- add <vidéo> <fichier|lien> [--licence …] | shift <vidéo> --beats <N> | catalog";

const main = async () => {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const json = flags.json === true;
  const [sub, ...rest] = positional;

  if (sub === "catalog") {
    const c = readCatalog();
    return output(json, c.map((e) => `${e.slug.padEnd(30)} ${e.title}, ${e.artist} (${e.licence})`).join("\n"), c);
  }

  if (sub !== "add" && sub !== "shift") return fail(USAGE, json);

  // `--dir` targets a folder directly (tests); otherwise the first positional is the video name.
  const name = typeof flags.dir === "string" ? undefined : (rest.shift() ?? fail("Nom de vidéo manquant", json));
  const dir = typeof flags.dir === "string" ? flags.dir : videoDir(name as string);
  const shiftCommand = `npm run music -- shift ${name ?? `--dir ${dir}`} --beats <N>`;

  if (sub === "shift") {
    const n = typeof flags.beats === "string" ? Number(flags.beats) : NaN;
    if (!Number.isInteger(n)) return fail(`Option --beats manquante ou non entière : ${shiftCommand} (N entier, négatif pour reculer)`, json);
    const video = readVideo(dir);
    if (!video.music) return fail("Cette vidéo n'a pas de morceau : npm run music -- add <vidéo> <morceau> d'abord", json);
    if (!video.music.beats)
      return fail("Les temps du morceau ne sont pas enregistrés dans video.json : relancer npm run music -- add <vidéo> <morceau> pour les calculer", json);
    video.music.downbeats = shiftDownbeats(video.music.beats, video.music.downbeats, n);
    writeVideo(dir, video);
    return output(
      json,
      `Premiers temps décalés de ${n} temps : ${video.music.downbeats.slice(0, 4).map((t) => `${t.toFixed(2)} s`).join(", ")}…\nÀ réécouter dans l'animatique (npm run studio).`,
      { ok: true, beats: n, downbeats: video.music.downbeats },
    );
  }

  const source = rest[0] ?? fail("Fichier ou lien du morceau manquant", json);
  const entry = readCatalog().find((e) => e.slug === source);
  const slug = entry?.slug ?? path.basename(source).replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const rel = `audio/${slug}.mp3`;
  const target = path.join(dir, rel);

  if (entry?.downloadUrl) await fetchToFile(entry.downloadUrl, target, entry.sha256);
  else if (/^https?:\/\//.test(source)) await fetchToFile(source, target);
  else if (existsSync(source)) {
    mkdirSync(path.dirname(target), { recursive: true });
    copyFileSync(source, target);
  } else return fail(`Fichier introuvable : ${source}`, json);

  const video = readVideo(dir);
  const segments = typeof flags.segments === "string" ? (JSON.parse(flags.segments) as [number, number][]) : undefined;
  const downbeatOffset = typeof flags["downbeat-offset"] === "string" ? Number(flags["downbeat-offset"]) : undefined;
  const r = analyzeTrack(target, video.durationSeconds, { segments, downbeatOffset });

  const licence = entry?.licence ?? (typeof flags.licence === "string" ? flags.licence : undefined);
  if (!licence) return fail("Licence du morceau inconnue : passer --licence \"…\" (et --credit si elle l'exige)", json);
  video.music = {
    file: rel,
    title: entry?.title ?? (typeof flags.title === "string" ? flags.title : slug),
    artist: entry?.artist ?? (typeof flags.artist === "string" ? flags.artist : "inconnu"),
    licence,
    credit: entry?.credit ?? (typeof flags.credit === "string" ? flags.credit : ""),
    creditRequired: entry?.creditRequired ?? typeof flags.credit === "string",
    pageUrl: entry?.pageUrl ?? (/^https?:\/\//.test(source) ? source : ""),
    bpm: Math.round(r.bpm * 100) / 100,
    segments: r.segments,
    downbeats: r.downbeats,
    beats: r.beats,
    outputDuration: Math.round(r.outputDuration * 1000) / 1000,
  };
  writeVideo(dir, video);
  buildEditWav(dir);
  video.music = readVideo(dir).music ?? video.music;
  writeFileSync(path.join(dir, "audio/LICENCE.txt"), `${video.music.title}, ${video.music.artist}\n${licence}\n${video.music.credit}\n${video.music.pageUrl}\n`);
  output(
    json,
    [
      `Morceau : ${video.music.title} (${video.music.bpm} BPM)`,
      `Montage proposé : ${r.segments.map(([a, b]) => `${a.toFixed(2)}–${b.toFixed(2)} s`).join(" puis ")}`,
      `Durée du film : ${video.music.outputDuration} s`,
      `Montage assemblé : ${video.music.edited}`,
      r.warning ? `Attention : ${r.warning}` : "",
      "À écouter dans l'animatique (npm run studio) avant de construire les scènes.",
      `Si le témoin de mesure tombe à côté dans l'animatique : ${shiftCommand}`,
    ].filter(Boolean).join("\n"),
    { ok: true, music: video.music, warning: r.warning },
  );
};

if (import.meta.url === `file://${process.argv[1]}`) void main().catch((e: Error) => fail(e.message, process.argv.includes("--json")));
