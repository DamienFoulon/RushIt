import { execFileSync, spawnSync } from "node:child_process";
import { repoRoot } from "./paths";

export const remotionEnv = (dir: string): NodeJS.ProcessEnv => ({ ...process.env, RUSHIT_VIDEO_DIR: dir });

/** Runs the Remotion CLI on the video in `dir`, output streamed to the terminal. */
export const runRemotion = (args: string[], dir: string) => {
  const r = spawnSync("npx", ["remotion", ...args], { cwd: repoRoot, env: remotionEnv(dir), stdio: "inherit" });
  if (r.status !== 0) throw new Error(`remotion ${args[0]} a échoué (code ${r.status})`);
};

/** The ffmpeg Remotion ships: no system install needed. */
export const remotionFfmpeg = (args: string[], opts: { input?: Buffer } = {}): Buffer =>
  execFileSync("npx", ["remotion", "ffmpeg", ...args], {
    cwd: repoRoot,
    input: opts.input,
    maxBuffer: 1024 * 1024 * 1024,
    stdio: ["pipe", "pipe", "pipe"],
  });
