import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { strFromU8, unzipSync } from "fflate";
import { fail, output, parseArgs } from "./lib/cli";
import { videosDir } from "./lib/paths";
import { lockHash, rushitVersion } from "./lib/version";
import { slugify } from "./new";
import { type Manifest, verifyManifest, versionAdvice } from "./share/manifest";

/** A video name must already be a safe folder name, as `new` would make it. */
const checkName = (name: string) => {
  if (typeof name !== "string" || !name || slugify(name) !== name)
    throw new Error(`Import refusé, nom de vidéo inutilisable comme dossier : « ${String(name)} »`);
};

/** Paths that are absolute, climb with "..", or would land outside `dir`. */
const escapingPaths = (dir: string, paths: string[]) => {
  const inside = path.resolve(dir) + path.sep;
  return paths.filter(
    (p) => path.isAbsolute(p) || path.posix.isAbsolute(p) || p.split(/[\\/]/).includes("..") || !path.resolve(dir, p).startsWith(inside),
  );
};

export const importVideo = (zip: string, opts: { as?: string; root?: string } = {}) => {
  const entries = unzipSync(new Uint8Array(readFileSync(zip)));
  if (!entries["manifest.json"]) throw new Error(`${zip} n'est pas une vidéo RushIt : manifest.json absent`);
  const manifest = JSON.parse(strFromU8(entries["manifest.json"])) as Manifest;
  checkName(manifest.name);
  const prefix = `${manifest.name}/`;
  const files: Record<string, Uint8Array> = {};
  for (const [p, b] of Object.entries(entries)) if (p.startsWith(prefix) && !p.endsWith("/")) files[p.slice(prefix.length)] = b;
  const bad = verifyManifest(files, manifest);
  if (bad.length) throw new Error(`Import refusé, fichiers altérés, manquants ou en trop :\n${bad.join("\n")}`);
  const name = opts.as ?? manifest.name;
  checkName(name);
  const dir = path.join(opts.root ?? videosDir, name);
  const escaping = escapingPaths(dir, Object.keys(files));
  if (escaping.length) throw new Error(`Import refusé, chemins qui sortent du dossier de la vidéo :\n${escaping.join("\n")}`);
  if (existsSync(dir)) throw new Error(`La vidéo ${name} existe déjà : ${dir}. Choisir un autre nom avec --as <nom>.`);
  for (const [p, b] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, p)), { recursive: true });
    writeFileSync(path.join(dir, p), b);
  }
  return { name, dir, advice: versionAdvice(manifest, rushitVersion(), lockHash()) };
};

const main = () => {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const json = flags.json === true;
  const zip = positional[0] ?? fail("Usage : npm run import -- <fichier.rushit.zip> [--as <nom>]", json);
  const r = importVideo(zip, { as: typeof flags.as === "string" ? flags.as : undefined });
  output(json, [`Importée : ${r.dir}`, r.advice ?? "Même version de RushIt : le rendu sera identique."].join("\n"), { ok: true, ...r });
};

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    main();
  } catch (e) {
    fail((e as Error).message, process.argv.includes("--json"));
  }
}
