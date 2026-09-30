import { copyFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Finding } from "./analyze";

const colors: Record<string, string> = {
  attente: "#ffd400", chevauchement: "#ff1744", coupe: "#76ff03", "hors-cadre": "#ff9100",
  "petit-texte": "#00e5ff", contraste: "#ea80fc", lecture: "#64ffda", zone: "#b0bec5", marge: "#ffab40", acceptation: "#90a4ae",
};
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export const writeReports = (
  dir: string,
  result: { findings: Finding[]; problems: string[]; errors: number; warnings: number; frames: number; ms: number },
  opts: { framesDir: string; forced?: boolean; stepSeconds: number; rushit: string; date: string; width: number; height: number },
) => {
  const qa = path.join(dir, "qa");
  const frames = path.join(qa, "frames");
  rmSync(frames, { recursive: true, force: true });
  mkdirSync(frames, { recursive: true });
  for (const f of new Set(result.findings.filter((x) => x.check !== "acceptation").map((x) => x.frame))) {
    const src = path.join(opts.framesDir, `frame-${f}.png`);
    if (existsSync(src)) copyFileSync(src, path.join(frames, `frame-${f}.png`));
  }
  const reportJson = path.join(qa, "report.json");
  writeFileSync(reportJson, JSON.stringify({ date: opts.date, rushit: opts.rushit, stepSeconds: opts.stepSeconds, forced: !!opts.forced, ...result }, null, 2) + "\n");

  const scale = 960 / opts.width;
  const card = (f: Finding) => `
<article class="${f.level}">
  <h3>${esc(f.level)} · ${esc(f.check)} · scène ${esc(f.scene ?? "?")} · ${f.seconds.toFixed(2)} s <code>[${f.id}]</code></h3>
  <p>${esc(f.element.text || f.element.selector)} : ${esc(f.cause)}${f.reason ? ` <em>(accepté : ${esc(f.reason)})</em>` : ""}</p>
  ${f.check === "acceptation" ? "" : `<div class="shot" style="height:${Math.round(opts.height * scale)}px"><img src="frames/frame-${f.frame}.png">${f.boxes
    .map((b, i) => `<div class="b" style="left:${b.x * scale}px;top:${b.y * scale}px;width:${b.w * scale}px;height:${b.h * scale}px;border-color:${i === 0 ? colors[f.check] : "#ffffff"}"></div>`)
    .join("")}</div>`}
  ${f.level === "avertissement" || f.level === "erreur" ? (f.check === "attente" ? "<p>Une attente ne s'accepte pas : corriger la scène ou l'attente.</p>" : `<p><code>npm run check -- ${esc(path.basename(dir))} --accept ${f.id} --reason "…"</code></p>`) : ""}
</article>`;
  const html = `<!doctype html><meta charset="utf-8"><title>Passe de contrôle, ${esc(path.basename(dir))}</title>
<style>body{font:15px system-ui,sans-serif;background:#16181d;color:#e8e8e8;margin:24px;max-width:1000px}h1{font-size:22px}
article{margin:0 0 28px;padding:12px 16px;border-left:4px solid #555;background:#1f2229}article.erreur{border-color:#ff1744}article.avertissement{border-color:#ffd400}article.accepté{border-color:#607d8b;opacity:.8}
h3{margin:0 0 6px;font-size:15px}.shot{position:relative;width:960px}.shot img{position:absolute;inset:0;width:960px}.b{position:absolute;border:3px solid;box-sizing:border-box}code{color:#9cdcfe}</style>
<h1>Passe de contrôle : ${result.errors} erreur(s), ${result.warnings} avertissement(s), ${result.frames} images en ${(result.ms / 1000).toFixed(1)} s${opts.forced ? " · rendu forcé" : ""}</h1>
${result.problems.map((p) => `<p>Règle illisible dans rules.md : ${esc(p)}</p>`).join("")}
${result.findings.map(card).join("")}`;
  const reportHtml = path.join(qa, "report.html");
  writeFileSync(reportHtml, html);
  return { reportJson, reportHtml };
};
