import { cpSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fail, output, parseArgs } from "./lib/cli";
import { repoRoot, videosDir } from "./lib/paths";
import { readVideo } from "./lib/video";
import { fetchToFile, readCatalog } from "./music";

type Rules = "createur" | "neutre" | "miennes" | "vides";
const RULES: Rules[] = ["createur", "neutre", "miennes", "vides"];

export const slugify = (name: string) =>
  name.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const rulesText = (rules: Rules): string => {
  if (rules === "miennes") {
    const mine = path.join(process.env.HOME ?? "", ".rushit/rules.md");
    if (!existsSync(mine)) throw new Error(`Pas de règles enregistrées : ${mine} n'existe pas`);
    return readFileSync(mine, "utf8");
  }
  return readFileSync(path.join(repoRoot, "rules", `${rules}.md`), "utf8");
};

export const createVideo = async (opts: { name: string; rules: Rules; from?: string; root?: string }) => {
  const name = slugify(opts.name);
  if (!name) throw new Error(`Nom de vidéo inutilisable : « ${opts.name} »`);
  const dir = path.join(opts.root ?? videosDir, name);
  if (existsSync(dir)) throw new Error(`La vidéo ${name} existe déjà : ${dir}`);
  const source = opts.from ? path.join(repoRoot, "examples", opts.from) : path.join(repoRoot, "templates/video");
  if (!existsSync(source)) throw new Error(`Exemple inconnu : ${opts.from}`);
  const rules = rulesText(opts.rules);
  cpSync(source, dir, { recursive: true, filter: (src) => !src.includes(`${path.sep}out`) });
  writeFileSync(path.join(dir, "rules.md"), rules);
  // An example's track is not in git: fetch it from the catalogue when missing.
  const video = readVideo(dir);
  if (video.music && !existsSync(path.join(dir, video.music.file))) {
    const slug = path.basename(video.music.file, ".mp3");
    const entry = readCatalog().find((e) => e.slug === slug);
    if (!entry?.downloadUrl) throw new Error(`Morceau absent et sans lien de téléchargement : ${video.music.file}`);
    await fetchToFile(entry.downloadUrl, path.join(dir, video.music.file), entry.sha256);
  }
  return { name, dir, renamed: name !== opts.name };
};

const main = async () => {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const json = flags.json === true;
  const name = positional[0] ?? fail("Usage : npm run new -- <nom> --rules createur|neutre|miennes|vides [--from carnet]", json);
  const rules = flags.rules;
  if (typeof rules !== "string" || !RULES.includes(rules as Rules))
    return fail(`Choisir les règles : --rules ${RULES.join("|")}. Demander à l'humain s'il veut définir les siennes.`, json);
  const r = await createVideo({ name, rules: rules as Rules, from: typeof flags.from === "string" ? flags.from : undefined });
  output(
    json,
    [`Vidéo créée : ${r.dir}`, r.renamed ? `Nom de dossier : ${r.name} (converti depuis « ${name} »)` : "", "Suite : method/02-scenario.md"].filter(Boolean).join("\n"),
    { ok: true, ...r },
  );
};

if (import.meta.url === `file://${process.argv[1]}`) void main().catch((e: Error) => fail(e.message, process.argv.includes("--json")));
