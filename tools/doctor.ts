import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { output, parseArgs } from "./lib/cli";
import { repoRoot } from "./lib/paths";
import { remotionFfmpeg } from "./lib/remotion";

const { flags } = parseArgs(process.argv.slice(2));
const json = flags.json === true;
const want = readFileSync(path.join(repoRoot, ".nvmrc"), "utf8").trim();
const check = (f: () => string) => {
  try {
    return { ok: true, detail: f().trim().split("\n").pop() ?? "" };
  } catch (e) {
    return { ok: false, detail: (e as Error).message.split("\n")[0] };
  }
};
const checks = [
  { name: "Node", ok: process.versions.node.split(".")[0] === want, detail: `${process.versions.node} (attendu : ${want}.x, voir .nvmrc)` },
  // Downloads Remotion's pinned headless browser when missing: the same one everywhere.
  { name: "Navigateur de Remotion", ...check(() => execFileSync("npx", ["remotion", "browser", "ensure"], { cwd: repoRoot, encoding: "utf8", stdio: "pipe" })) },
  { name: "ffmpeg de Remotion", ...check(() => remotionFfmpeg(["-version"]).toString().split("\n")[0]) },
];
const ok = checks.every((c) => c.ok);
output(json, checks.map((c) => `${c.ok ? "ok " : "NON"} ${c.name} : ${c.detail}`).join("\n"), { ok, checks });
process.exit(ok ? 0 : 1);
