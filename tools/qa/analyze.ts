import type { Layout } from "../../kit/schema";
import type { Box, ExpectFact, ProbeReport, TextFact } from "../../kit/qa/types";
import type { Accepted } from "./accepted";
import { findingId } from "./ids";
import type { CheckName, Level, QaRules } from "./rules";

export type Finding = {
  id: string;
  level: Level | "accepté";
  check: CheckName | "acceptation";
  scene: string | null;
  frame: number;
  seconds: number;
  element: { selector: string; text: string };
  cause: string;
  boxes: Box[];
  reason?: string;
};

type Raw = Omit<Finding, "id" | "level" | "seconds"> & { elementKey: string; allowed: string[]; reasons: string[] };

const pct = (x: number) => `${Math.round(x * 100)} %`;
const inside = (b: Box, l: number, t: number, w: number, h: number) => b.x >= l && b.y >= t && b.x + b.w <= l + w && b.y + b.h <= t + h;
const textElement = (t: TextFact) => ({ selector: t.selector, text: t.text });
const textKey = (t: TextFact) => `${t.selector}|${t.text}`;

/**
 * A line typed letter by letter shows a new prefix on every frame. Each prefix
 * is named after the complete text it grows into, so that the element gives one
 * finding per check. A prefix only grows into a text it never sits next to: two
 * texts shown together on one frame are two elements, the short one stays apart.
 */
const typedTexts = (reports: readonly ProbeReport[]) => {
  const group = (t: TextFact) => `${t.scene ?? ""}|${t.selector}`;
  const frames = new Map<string, Map<string, Set<number>>>();
  for (const r of reports)
    for (const t of r.texts) {
      const texts = frames.get(group(t)) ?? new Map<string, Set<number>>();
      texts.set(t.text, (texts.get(t.text) ?? new Set()).add(r.frame));
      frames.set(group(t), texts);
    }
  const complete = new Map<string, string>();
  for (const [g, texts] of frames)
    for (const [short, seen] of texts) {
      const longer = [...texts.keys()]
        .filter((long) => long.length > short.length && long.startsWith(short) && ![...texts.get(long)!].some((f) => seen.has(f)))
        .sort((a, b) => b.length - a.length);
      // Only one line of growth: "Rap" in "Rappeler" and "Rapport" belongs to neither.
      if (longer.length && longer.every((l) => longer[0].startsWith(l))) complete.set(`${g}|${short}`, longer[0]);
    }
  return (t: TextFact): TextFact => {
    const full = complete.get(`${group(t)}|${t.text}`);
    return full === undefined ? t : { ...t, text: full };
  };
};

const expectRaw = (e: ExpectFact, frame: number): Raw | null => {
  const base = { check: "attente" as const, scene: e.scene, frame, element: { selector: `[data-rushit-expect=${e.id}]`, text: "" }, elementKey: `expect:${e.id}`, allowed: [], reasons: [], boxes: [e.box, ...e.related].filter(Boolean) as Box[] };
  const within = (r: [number, number] | null) => !!r && frame >= r[0] && frame <= r[1];
  if (within(e.visible)) {
    const share = e.inFrame * e.shown;
    if (e.present && e.opacity >= 0.95 && share >= 0.9) return null;
    const causes: string[] = [];
    if (!e.present) causes.push("non monté");
    else {
      if (e.inFrame < 0.99) causes.push(`hors cadre (${pct(1 - e.inFrame)})`);
      if (e.clippedShare > 0) causes.push(`rogné par ${e.clippedBy ?? "?"} (${pct(e.clippedShare)})`);
      if (e.coveredShare > 0) causes.push(`recouvert par ${e.coveredBy ?? "?"} (${pct(e.coveredShare)})`);
      if (e.opacity < 0.95) causes.push(`transparent (opacité ${e.opacity.toFixed(2)})`);
    }
    return { ...base, cause: `doit être visible, visible à ${pct(e.present ? share * Math.min(1, e.opacity) : 0)} : ${causes.join(", ")}` };
  }
  if (within(e.hidden) && e.present && e.opacity >= 0.05 && e.inFrame * e.shown > 0)
    return { ...base, cause: `doit être caché, visible à ${pct(e.inFrame * e.shown)}` };
  return null;
};

export const analyze = ({
  reports, fps, stepFrames, rules, layout, scenesWithColumn, accepted,
}: {
  reports: readonly ProbeReport[];
  fps: number;
  stepFrames: number;
  rules: QaRules;
  layout: Layout;
  scenesWithColumn: ReadonlySet<string>;
  accepted: readonly Accepted[];
}): { findings: Finding[]; problems: string[] } => {
  const raws: Raw[] = [];
  const sorted = [...reports].sort((a, b) => a.frame - b.frame);
  const expectScenes = new Map<string, Set<string>>();
  const named = typedTexts(sorted);

  for (const r of sorted) {
    const seenHere = new Set<string>();
    for (const e of r.expects) {
      if (seenHere.has(e.id)) raws.push({ check: "attente", scene: e.scene, frame: r.frame, element: { selector: `[data-rushit-expect=${e.id}]`, text: "" }, elementKey: `expect:${e.id}`, cause: `identifiant en double : ${e.id}`, boxes: [], allowed: [], reasons: [] });
      seenHere.add(e.id);
      const scenes = expectScenes.get(e.id) ?? new Set();
      scenes.add(e.scene ?? "");
      expectScenes.set(e.id, scenes);
      const raw = expectRaw(e, r.frame);
      if (raw) raws.push(raw);
    }
    for (const o of r.overlaps)
      raws.push({ check: "chevauchement", scene: o.a.split("|")[0] || null, frame: r.frame, element: { selector: o.a.split("|")[1], text: `${o.a.split("|")[2]} / ${o.b.split("|")[2]}` }, elementKey: [o.a, o.b].sort().join(" & "), cause: `${o.area} px² de recouvrement`, boxes: o.boxes, allowed: [], reasons: [] });
    for (const t of r.texts) {
      const base = { scene: t.scene, frame: r.frame, element: textElement(named(t)), elementKey: textKey(named(t)), boxes: [t.box], allowed: t.allowed, reasons: t.reasons };
      if (t.overflow || t.clippedBy) raws.push({ ...base, check: "coupe", cause: t.clippedBy ? `coupé par ${t.clippedBy}` : "déborde de son bloc" });
      if (t.inFrame < 0.9) raws.push({ ...base, check: "hors-cadre", cause: `${pct(1 - t.inFrame)} hors de l'image` });
      if (t.fontPx < rules.minTextPx) raws.push({ ...base, check: "petit-texte", cause: `${t.fontPx} px à l'écran (minimum ${rules.minTextPx})` });
      if (!t.column && t.inFrame > 0 && t.margin < rules.minMarginPx) raws.push({ ...base, check: "marge", cause: `à ${t.margin} px du bord de sa fenêtre (minimum ${rules.minMarginPx})` });
      const min = t.fontPx >= 24 || (t.bold && t.fontPx >= 18.66) ? 3 : rules.minContrast;
      if (t.contrast !== null && t.contrast < min) raws.push({ ...base, check: "contraste", cause: `contraste ${t.contrast}:1 (minimum ${min})` });
      const col = layout.textColumn;
      if (col && t.scene && scenesWithColumn.has(t.scene) && !t.column) {
        const inColumn = inside(t.box, col.left, 0, col.width, r.height);
        const s = layout.stage;
        if (!inColumn && !inside(t.box, s.left, s.top, s.width, s.height)) raws.push({ ...base, check: "zone", cause: "hors de la colonne de texte et de la scène" });
      }
    }
  }

  for (const [id, scenes] of expectScenes)
    if (scenes.size > 1) raws.push({ check: "attente", scene: null, frame: 0, element: { selector: `[data-rushit-expect=${id}]`, text: "" }, elementKey: `expect:${id}:double`, cause: `identifiant en double : ${id} dans ${[...scenes].join(", ")}`, boxes: [], allowed: [], reasons: [] });

  // Reading time, on the regular samples only.
  const regular = sorted.filter((r) => r.frame % stepFrames === 0);
  const runs = new Map<string, { t: TextFact; frame: number; best: number; current: number; last: number }>();
  for (const r of regular)
    for (const t of r.texts) {
      if (!t.column && t.words < 3) continue;
      const ok = t.inFrame >= 0.99 && t.opacity >= 0.95 && !t.overflow && !t.clippedBy;
      const s = runs.get(t.key) ?? { t, frame: r.frame, best: 0, current: 0, last: -Infinity };
      s.current = ok ? (r.frame - s.last === stepFrames ? s.current + 1 : 1) : 0;
      if (ok) s.last = r.frame;
      s.best = Math.max(s.best, s.current);
      runs.set(t.key, s);
    }
  for (const { t, frame, best } of runs.values()) {
    if (best < 2) continue;
    const seconds = (best * stepFrames) / fps;
    const needed = t.words * rules.secondsPerWord;
    if (seconds < needed)
      raws.push({ check: "lecture", scene: t.scene, frame, element: textElement(t), elementKey: textKey(t), cause: `posé ${seconds.toFixed(1)} s pour ${t.words} mots (${needed.toFixed(1)} s demandées)`, boxes: [t.box], allowed: t.allowed, reasons: t.reasons });
  }

  // One finding per id: the first frame, with how many frames showed it.
  const byId = new Map<string, { raw: Raw; count: number }>();
  for (const raw of raws) {
    const id = findingId(raw.check, raw.scene, raw.elementKey);
    const seen = byId.get(id);
    if (seen) seen.count++;
    else byId.set(id, { raw, count: 1 });
  }
  const acceptedById = new Map(accepted.map((a) => [a.id, a]));
  const findings: Finding[] = [];
  for (const [id, { raw, count }] of byId) {
    const check = raw.check as CheckName;
    const level = rules.levels[check];
    if (level === "ignoré") continue;
    const allowedHere = check !== "attente" && raw.allowed.includes(check);
    const fromFile = check !== "attente" ? acceptedById.get(id) : undefined;
    findings.push({
      id,
      level: allowedHere || fromFile ? "accepté" : level,
      check,
      scene: raw.scene,
      frame: raw.frame,
      seconds: +(raw.frame / fps).toFixed(2),
      element: raw.element,
      cause: count > 1 ? `${raw.cause} (vu sur ${count} images)` : raw.cause,
      boxes: raw.boxes,
      ...(allowedHere ? { reason: raw.reasons[0] } : fromFile ? { reason: fromFile.reason } : {}),
    });
  }
  for (const a of accepted)
    if (!byId.has(a.id))
      findings.push({ id: a.id, level: "avertissement", check: "acceptation", scene: a.scene, frame: 0, seconds: 0, element: { selector: a.element.split("|")[0], text: a.element.split("|").slice(1).join("|") }, cause: `acceptation orpheline : plus rien ne correspond (${a.reason})`, boxes: [] });

  const order = { erreur: 0, avertissement: 1, accepté: 2, ignoré: 3 };
  findings.sort((a, b) => order[a.level] - order[b.level] || a.frame - b.frame);
  return { findings, problems: rules.problems };
};
