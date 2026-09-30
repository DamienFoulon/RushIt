import { execFileSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fail, output, parseArgs } from "./lib/cli";
import { repoRoot, videoDir } from "./lib/paths";
import { remotionBinary } from "./lib/remotion";
import { rushitVersion } from "./lib/version";
import { decodePcm16 } from "./music/decode";

const require = createRequire(import.meta.url);

export type MediaHashes = { width: number; height: number; frames: string[]; pcm: string | null };

export type HashesFile = MediaHashes & {
  rushit: string; remotion: string; chrome: string; platform: string; arch: string; mp4Sha256: string;
};

const sha1 = (b: Uint8Array) => createHash("sha1").update(b).digest("hex");

export const fileSha256 = (file: string) => createHash("sha256").update(readFileSync(file)).digest("hex");

/** Size of the first video stream, and whether the file has sound, by the ffprobe Remotion ships. */
const probe = (file: string) => {
  const { file: ffprobe, env } = remotionBinary("ffprobe");
  const info = JSON.parse(
    execFileSync(ffprobe, ["-v", "error", "-show_entries", "stream=codec_type,width,height", "-of", "json", file], { env, encoding: "utf8" }),
  ) as { streams: { codec_type: string; width?: number; height?: number }[] };
  const video = info.streams.find((s) => s.codec_type === "video");
  if (!video?.width || !video.height) throw new Error(`Pas d'image dans ${file}`);
  return { width: video.width, height: video.height, audio: info.streams.some((s) => s.codec_type === "audio") };
};

/** One sha1 per decoded frame (RGB), read as a stream: a full-size film does not fit in memory. */
const frameHashes = (file: string, width: number, height: number): Promise<string[]> =>
  new Promise((resolve, reject) => {
    const { file: ffmpeg, env } = remotionBinary("ffmpeg");
    // Remotion's ffmpeg has the rawvideo encoder but no rawvideo muxer: image2pipe writes the frames back to back.
    const p = spawn(ffmpeg, ["-v", "error", "-i", file, "-map", "0:v:0", "-f", "image2pipe", "-c:v", "rawvideo", "-pix_fmt", "rgb24", "-"], { env });
    const frameSize = width * height * 3;
    const out: string[] = [];
    let hash = createHash("sha1");
    let filled = 0;
    let stderr = "";
    p.stderr.on("data", (d: Buffer) => (stderr += d.toString()));
    p.stdout.on("data", (chunk: Buffer) => {
      let at = 0;
      while (at < chunk.length) {
        const take = Math.min(frameSize - filled, chunk.length - at);
        hash.update(chunk.subarray(at, at + take));
        filled += take;
        at += take;
        if (filled === frameSize) {
          out.push(hash.digest("hex"));
          hash = createHash("sha1");
          filled = 0;
        }
      }
    });
    p.on("error", reject);
    p.on("close", (code) => (code === 0 ? resolve(out) : reject(new Error(`Décodage des images impossible (${code}) : ${stderr.trim()}`))));
  });

/**
 * What a render looks and sounds like, independent of how it is packed: one
 * sha1 per decoded frame, and one sha1 of the whole decoded sound (16-bit PCM).
 * Two renders with the same hashes show the same pictures and play the same sound.
 */
export const mediaHashes = async (mp4: string): Promise<MediaHashes> => {
  const { width, height, audio } = probe(mp4);
  const frames = await frameHashes(mp4, width, height);
  return { width, height, frames, pcm: audio ? sha1(decodePcm16(mp4, 2, 48_000)) : null };
};

const packageVersion = (name: string) => (require(`${name}/package.json`) as { version: string }).version;

/** Version of the headless browser Remotion downloaded, as it records it. */
const chromeVersion = () => {
  const file = path.join(repoRoot, "node_modules/.remotion/chrome-headless-shell/VERSION");
  return existsSync(file) ? readFileSync(file, "utf8").trim() : "inconnue (npx remotion browser ensure)";
};

/** Writes `out/hashes.json` for the render of the video in `dir`: to compare two machines. */
export const writeHashes = async (dir: string): Promise<{ file: string; hashes: HashesFile }> => {
  const mp4 = path.join(dir, "out", `${path.basename(dir)}.mp4`);
  if (!existsSync(mp4)) throw new Error(`Pas de rendu à mesurer : ${mp4} (npm run render d'abord)`);
  const hashes: HashesFile = {
    rushit: rushitVersion(),
    remotion: packageVersion("remotion"),
    chrome: chromeVersion(),
    platform: process.platform,
    arch: process.arch,
    mp4Sha256: fileSha256(mp4),
    ...(await mediaHashes(mp4)),
  };
  const file = path.join(dir, "out", "hashes.json");
  writeFileSync(file, JSON.stringify(hashes, null, 2) + "\n");
  return { file, hashes };
};

const main = async () => {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const json = flags.json === true;
  const name = positional[0] ?? fail("Usage : npm run hashes -- <vidéo>", json);
  const { file, hashes } = await writeHashes(videoDir(name));
  output(
    json,
    `Empreintes : ${file}\n${hashes.frames.length} images de ${hashes.width}×${hashes.height}, son ${hashes.pcm ?? "absent"}\nRushIt ${hashes.rushit}, Remotion ${hashes.remotion}, Chrome ${hashes.chrome}, ${hashes.platform}-${hashes.arch}`,
    { ok: true, file, ...hashes },
  );
};

if (import.meta.url === `file://${process.argv[1]}`) void main().catch((e: Error) => fail(e.message, process.argv.includes("--json")));
