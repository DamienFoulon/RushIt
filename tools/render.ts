import { mkdirSync } from "node:fs";
import path from "node:path";
import { filmSeconds } from "../kit/schema";
import { runCheck } from "./check";
import { fail, output, parseArgs } from "./lib/cli";
import { videoDir } from "./lib/paths";
import { remotionFfmpeg, runRemotion } from "./lib/remotion";
import { checkAssets, readVideo } from "./lib/video";

/**
 * The check pass runs first and refuses the render while an error remains.
 * `force` renders anyway and says so in the report. `skipCheck` is for the
 * reproducibility tests only, which do not test the pass.
 */
export const renderVideo = async (dir: string, opts: { scale?: number; force?: boolean; skipCheck?: boolean } = {}) => {
  const video = readVideo(dir);
  const missing = checkAssets(dir, video);
  if (missing.length) throw new Error(`Fichiers déclarés mais absents dans ${dir} :\n${missing.join("\n")}`);
  if (!opts.skipCheck) {
    const check = await runCheck(dir, { forced: opts.force });
    if (check.errors > 0 && !opts.force)
      throw new Error(
        `Rendu refusé : ${check.errors} erreur(s) à la passe de contrôle.\n` +
          check.findings
            .filter((f) => f.level === "erreur")
            .slice(0, 10)
            .map((f) => `  ${f.check}, scène ${f.scene} à ${f.seconds} s : ${f.cause}`)
            .join("\n") +
          `\nRapport : ${check.reportHtml}\nPour rendre quand même : npm run render -- <vidéo> --force`,
      );
  }
  const name = path.basename(dir);
  mkdirSync(path.join(dir, "out"), { recursive: true });
  const raw = path.join(dir, "out", `${name}.raw.mp4`);
  const mp4 = path.join(dir, "out", `${name}.mp4`);
  const poster = path.join(dir, "out", "poster.jpg");
  runRemotion(["render", "Film", raw, ...(opts.scale ? ["--scale", String(opts.scale)] : [])], dir);
  const at = video.posterSeconds ?? Math.max(0, filmSeconds(video) - 1);
  remotionFfmpeg(["-y", "-v", "error", "-ss", String(at), "-i", raw, "-frames:v", "1", "-q:v", "2", poster]);
  // The poster becomes frame 0, so every platform's thumbnail shows it. Same frame count, audio copied.
  // Remotion's ffmpeg has no overlay filter: the poster (same size, taken from the raw render) is a
  // one-frame segment, followed by the raw render without its first frame.
  remotionFfmpeg([
    "-y", "-v", "error", "-i", raw, "-framerate", String(video.format.fps), "-i", poster,
    "-filter_complex", "[1:v]format=yuv420p[p];[0:v]trim=start_frame=1,format=yuv420p[r];[p][r]concat=n=2:v=1:a=0[o]",
    "-map", "[o]", "-map", "0:a?", "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", "-c:a", "copy",
    "-movflags", "+faststart", mp4,
  ]);
  return { mp4, poster };
};

const main = async () => {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const json = flags.json === true;
  const name = positional[0] ?? fail("Usage : npm run render -- <vidéo> [--scale 0.333] [--force]", json);
  const r = await renderVideo(videoDir(name), {
    scale: typeof flags.scale === "string" ? Number(flags.scale) : undefined,
    force: flags.force === true,
  });
  output(json, `Rendu : ${r.mp4}\nAffiche : ${r.poster}`, { ok: true, ...r });
};

if (import.meta.url === `file://${process.argv[1]}`) void main().catch((e: Error) => fail(e.message, process.argv.includes("--json")));
