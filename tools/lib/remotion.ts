import { execFileSync, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { repoRoot } from "./paths";

const require = createRequire(import.meta.url);

export const remotionEnv = (dir: string): NodeJS.ProcessEnv => ({ ...process.env, RUSHIT_VIDEO_DIR: dir });

/** Runs the Remotion CLI on the video in `dir`, output streamed to the terminal. */
export const runRemotion = (args: string[], dir: string) => {
  const r = spawnSync("npx", ["remotion", ...args], { cwd: repoRoot, env: remotionEnv(dir), stdio: "inherit" });
  if (r.status !== 0) throw new Error(`remotion ${args[0]} a échoué (code ${r.status})`);
};

const isMusl = (): boolean => {
  const header = (process.report?.getReport() as { header?: { glibcVersionRuntime?: string } } | undefined)?.header;
  return !header?.glibcVersionRuntime;
};

/** Name of the compositor package Remotion installs for this machine. */
const compositorPackage = (): string => {
  const { platform, arch } = process;
  if (platform === "linux") return `@remotion/compositor-linux-${arch}-${isMusl() ? "musl" : "gnu"}`;
  if (platform === "darwin") return `@remotion/compositor-darwin-${arch}`;
  if (platform === "win32") return `@remotion/compositor-win32-${arch}-msvc`;
  return `@remotion/compositor-${platform}-${arch}`;
};

/** Folder holding Remotion's ffmpeg and the libraries it loads. */
export const remotionFfmpegDir = (): string => {
  const pkg = compositorPackage();
  try {
    return path.dirname(require.resolve(`${pkg}/package.json`));
  } catch {
    throw new Error(`ffmpeg de Remotion introuvable : le paquet ${pkg} n'est pas installé (relancer npm ci).`);
  }
};

/** A binary Remotion ships (`ffmpeg`, `ffprobe`), with the environment that finds its libraries. */
export const remotionBinary = (name: "ffmpeg" | "ffprobe") => {
  const dir = remotionFfmpegDir();
  const libraryPath = process.platform === "darwin" ? "DYLD_LIBRARY_PATH" : "LD_LIBRARY_PATH";
  const inherited = process.env[libraryPath];
  return {
    file: path.join(dir, process.platform === "win32" ? `${name}.exe` : name),
    env: { ...process.env, [libraryPath]: inherited ? `${dir}${path.delimiter}${inherited}` : dir },
  };
};

/**
 * The ffmpeg Remotion ships: no system install needed. Called directly rather
 * than through `npx remotion ffmpeg`, which loads remotion.config.ts and so
 * needs a current video.
 */
export const remotionFfmpeg = (args: string[], opts: { input?: Buffer } = {}): Buffer => {
  const { file, env } = remotionBinary("ffmpeg");
  return execFileSync(file, args, {
    cwd: repoRoot,
    env,
    input: opts.input,
    maxBuffer: 1024 * 1024 * 1024,
    stdio: ["pipe", "pipe", "pipe"],
  });
};
