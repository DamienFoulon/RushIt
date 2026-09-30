import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { strToU8, zipSync } from "fflate";
import { fail, output, parseArgs } from "./lib/cli";
import { videoDir } from "./lib/paths";
import { lockHash, rushitVersion } from "./lib/version";
import { buildManifest } from "./share/manifest";

/** Every file of the video, relative paths, minus intermediate renders. */
const collect = (dir: string, rel = ""): Record<string, Uint8Array> => {
  const out: Record<string, Uint8Array> = {};
  for (const entry of readdirSync(path.join(dir, rel))) {
    const r = path.posix.join(rel, entry);
    if (r.endsWith(".raw.mp4") || r.endsWith(".raw4k.mp4")) continue;
    const full = path.join(dir, r);
    if (statSync(full).isDirectory()) Object.assign(out, collect(dir, r));
    else out[r] = new Uint8Array(readFileSync(full));
  }
  return out;
};

export const exportVideo = (dir: string, zipPath: string) => {
  const name = path.basename(dir);
  const files = collect(dir);
  const manifest = buildManifest(files, name, rushitVersion(), lockHash());
  const entries: Record<string, Uint8Array> = { "manifest.json": strToU8(JSON.stringify(manifest, null, 2)) };
  for (const [p, b] of Object.entries(files)) entries[`${name}/${p}`] = b;
  writeFileSync(zipPath, zipSync(entries, { level: 6 }));
  return zipPath;
};

const main = () => {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const json = flags.json === true;
  const name = positional[0] ?? fail("Usage : npm run export -- <vidéo>", json);
  const zip = exportVideo(videoDir(name), path.resolve(`${name}.rushit.zip`));
  output(json, `Exporté : ${zip}`, { ok: true, zip });
};

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    main();
  } catch (e) {
    fail((e as Error).message, process.argv.includes("--json"));
  }
}
