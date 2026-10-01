import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { filmSeconds } from "../kit/schema";
import type { VideoDefinition } from "../kit/definition";
import { timeScenes } from "../kit/timing";
import { fail, output, parseArgs } from "./lib/cli";
import { videoDir } from "./lib/paths";
import { rushitVersion } from "./lib/version";
import { readVideo } from "./lib/video";
import { addAccepted, readAccepted } from "./qa/accepted";
import { analyze, type Finding } from "./qa/analyze";
import { boundFrames, sampleFrames } from "./qa/instants";
import { writeReports } from "./qa/report";
import { parseQaRules } from "./qa/rules";
import { openSession } from "./qa/stills";

export type CheckResult = {
  findings: Finding[]; problems: string[]; errors: number; warnings: number; frames: number; ms: number;
  reportJson: string; reportHtml: string;
};

export const runCheck = async (dir: string, opts: { scene?: string; every?: number; forced?: boolean } = {}): Promise<CheckResult> => {
  const t0 = performance.now();
  const video = readVideo(dir);
  const definition = (await import(pathToFileURL(path.join(dir, "index.tsx")).href)).default as VideoDefinition;
  const fps = video.format.fps;
  const totalFrames = Math.round(filmSeconds(video) * fps);
  const timed = timeScenes(definition.scenes, video.music ?? { downbeats: [], outputDuration: video.durationSeconds }, fps);
  const stepSeconds = opts.every ?? 0.5;
  const stepFrames = Math.max(1, Math.round(stepSeconds * fps));
  const rules = parseQaRules(readFileSync(path.join(dir, "rules.md"), "utf8"));
  const framesDir = mkdtempSync(path.join(tmpdir(), "rushit-check-"));
  const session = await openSession(dir);
  try {
    const first = sampleFrames({ timed, fps, totalFrames, stepSeconds, scene: opts.scene });
    const reports = await session.render(first, framesDir);
    const range: [number, number] = [first[0], first[first.length - 1]];
    const bounds = reports.flatMap((r) => r.expects.flatMap((e) => [e.visible, e.hidden].filter(Boolean) as [number, number][]));
    reports.push(...(await session.render(boundFrames(bounds, new Set(first), range), framesDir)));
    const scenesWithColumn = new Set(definition.scenes.filter((s) => s.texts.length > 0).map((s) => s.id));
    const { findings, problems } = analyze({ reports, fps, stepFrames, rules, layout: video.theme.layout, scenesWithColumn, accepted: readAccepted(dir) });
    // With --scene, only that scene was looked at: an acceptation of another scene is not orphaned.
    const scoped = opts.scene ? findings.filter((f) => f.scene === opts.scene) : findings;
    const summary = {
      findings: scoped, problems,
      errors: scoped.filter((f) => f.level === "erreur").length,
      warnings: scoped.filter((f) => f.level === "avertissement").length,
      frames: reports.length, ms: Math.round(performance.now() - t0),
    };
    const paths = writeReports(dir, summary, {
      framesDir, forced: opts.forced, stepSeconds, rushit: rushitVersion(),
      date: new Date().toISOString(), width: video.format.width, height: video.format.height,
    });
    return { ...summary, ...paths };
  } finally {
    await session.close();
    rmSync(framesDir, { recursive: true, force: true });
  }
};

const line = (f: Finding) =>
  `${f.level.padEnd(13)} scène ${(f.scene ?? "?").padEnd(12)} ${f.seconds.toFixed(1).padStart(6)} s  ${f.check.padEnd(13)} ${(f.element.text || f.element.selector).slice(0, 40)} : ${f.cause}  [${f.id}]`;

const main = async () => {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const json = flags.json === true;
  const name = positional[0] ?? fail("Usage : npm run check -- <vidéo> [--scene <id>] [--every <s>] [--accept <id> --reason \"…\"] [--open]", json);
  const dir = videoDir(name);

  if (typeof flags.accept === "string") {
    const report = JSON.parse(readFileSync(path.join(dir, "qa/report.json"), "utf8")) as { findings: Finding[] };
    const f = report.findings.find((x) => x.id === flags.accept) ?? fail(`Signalement inconnu : ${flags.accept} (relancer check d'abord)`, json);
    addAccepted(dir, f, typeof flags.reason === "string" ? flags.reason : "", new Date().toISOString().slice(0, 10));
    return output(json, `Accepté : ${f.id} (${f.check}, scène ${f.scene})`, { ok: true, id: f.id });
  }

  const r = await runCheck(dir, {
    scene: typeof flags.scene === "string" ? flags.scene : undefined,
    every: typeof flags.every === "string" ? Number(flags.every.replace(",", ".")) : undefined,
  });
  output(
    json,
    [
      `${r.errors} erreur(s), ${r.warnings} avertissement(s), ${r.findings.filter((f) => f.level === "accepté").length} accepté(s) · ${r.frames} images en ${(r.ms / 1000).toFixed(1)} s`,
      ...r.problems.map((p) => `Règle illisible dans rules.md : ${p}`),
      ...r.findings.map(line),
      `Rapport : ${r.reportHtml}`,
    ].join("\n"),
    r,
  );
  if (flags.open === true) spawn(process.platform === "darwin" ? "open" : "xdg-open", [r.reportHtml], { detached: true, stdio: "ignore" }).unref();
  process.exitCode = r.errors > 0 ? 1 : 0;
};

if (import.meta.url === `file://${process.argv[1]}`) void main().catch((e: Error) => fail(e.message, process.argv.includes("--json")));
