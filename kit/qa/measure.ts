import type { Box, ExpectFact, OverlapFact, ProbeReport, TextFact } from "./types";

const toBox = (r: { left: number; top: number; width: number; height: number }): Box => ({
  x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height),
});

/** Nearest labelled ancestor, as a stable selector: #id, [data-rushit-expect], [data-rushit-id], or the tag. */
const selectorOf = (el: Element): string => {
  for (let e: Element | null = el; e; e = e.parentElement) {
    if (e.id) return `#${e.id}`;
    const h = e as HTMLElement;
    if (h.dataset?.rushitExpect) return `[data-rushit-expect=${h.dataset.rushitExpect}]`;
    if (h.dataset?.rushitId) return `[data-rushit-id=${h.dataset.rushitId}]`;
    if (h.dataset?.rushitScene) break;
  }
  return el.tagName.toLowerCase();
};

const sceneOf = (el: Element) => (el.closest("[data-rushit-scene]") as HTMLElement | null)?.dataset.rushitScene ?? null;

const parseColor = (c: string): [number, number, number, number] | null => {
  const m = c.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
  return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
};

const effectiveOpacity = (el: Element | null): number => {
  let o = 1;
  for (let e = el; e && e instanceof Element; e = e.parentElement) {
    const cs = getComputedStyle(e);
    if (cs.display === "none") return 0;
    if (cs.visibility === "hidden" && e === el) return 0;
    o *= parseFloat(cs.opacity);
  }
  return o;
};

const textRects = (el: Element): DOMRect[] => {
  const rects: DOMRect[] = [];
  for (const n of Array.from(el.childNodes)) {
    if (n.nodeType === Node.TEXT_NODE && n.textContent!.trim()) {
      const r = document.createRange();
      r.selectNodeContents(n);
      rects.push(...Array.from(r.getClientRects()).filter((x) => x.width > 0 && x.height > 0));
    }
  }
  return rects;
};

const union = (rects: DOMRect[]): DOMRect | null => {
  if (!rects.length) return null;
  const l = Math.min(...rects.map((r) => r.left));
  const t = Math.min(...rects.map((r) => r.top));
  return new DOMRect(l, t, Math.max(...rects.map((r) => r.right)) - l, Math.max(...rects.map((r) => r.bottom)) - t);
};

const clippingAncestors = (el: Element): HTMLElement[] => {
  const out: HTMLElement[] = [];
  for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) {
    const cs = getComputedStyle(e);
    if (cs.overflow !== "visible" || cs.clipPath !== "none") out.push(e);
  }
  return out;
};

/** Paints something at (x, y): a background, an image, an SVG shape or glyphs. */
const paintsAt = (el: Element, x: number, y: number): boolean => {
  if (effectiveOpacity(el) < 0.05) return false;
  const cs = getComputedStyle(el);
  const bg = parseColor(cs.backgroundColor);
  if ((bg && bg[3] > 0.05) || cs.backgroundImage !== "none") return true;
  if (["IMG", "VIDEO", "CANVAS", "IFRAME"].includes(el.tagName)) return true;
  if (el instanceof SVGElement && el.tagName.toLowerCase() !== "svg") return true;
  return textRects(el).some((r) => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom);
};

const inFrameShare = (r: DOMRect, W: number, H: number) =>
  (Math.max(0, Math.min(r.right, W) - Math.max(r.left, 0)) * Math.max(0, Math.min(r.bottom, H) - Math.max(r.top, 0))) /
  Math.max(1, r.width * r.height);

/** Samples the element's box: which points are its own, which survive clipping, which are covered and by whom. */
const sample = (target: Element, rect: DOMRect, W: number, H: number) => {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < 5; i++)
    for (let j = 0; j < 5; j++) {
      const x = rect.left + ((i + 0.5) / 5) * rect.width;
      const y = rect.top + ((j + 0.5) / 5) * rect.height;
      if (x >= 0 && y >= 0 && x < W && y < H) pts.push({ x, y });
    }
  const mine = (e: Element) => target === e || target.contains(e);
  const clippers = clippingAncestors(target);
  const saved = clippers.map((c) => [c.style.overflow, c.style.clipPath] as const);
  clippers.forEach((c) => { c.style.overflow = "visible"; c.style.clipPath = "none"; });
  const own = pts.map((p) => document.elementsFromPoint(p.x, p.y).some(mine));
  clippers.forEach((c, k) => { c.style.overflow = saved[k][0]; c.style.clipPath = saved[k][1]; });
  return pts
    .map((p, k) => {
      const stack = document.elementsFromPoint(p.x, p.y);
      const idx = stack.findIndex(mine);
      const coveredBy = idx > 0 ? (stack.slice(0, idx).find((e) => !e.contains(target) && paintsAt(e, p.x, p.y)) ?? null) : null;
      return { ...p, own: own[k], hit: idx >= 0, coveredBy };
    })
    .filter((s) => s.own);
};

const luminance = ([r, g, b]: number[]) => {
  const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

/** Colour composited behind (x, y) under `el`, or null when an image or gradient is involved. */
const backgroundBehind = (el: Element, x: number, y: number): number[] | null => {
  const stack = document.elementsFromPoint(x, y);
  const layers: [number[], number][] = [];
  let left = 1;
  for (const e of stack.slice(stack.indexOf(el) + 1)) {
    const cs = getComputedStyle(e);
    if (cs.backgroundImage !== "none" || ["IMG", "VIDEO", "CANVAS", "IFRAME"].includes(e.tagName)) return null;
    const c = parseColor(cs.backgroundColor);
    if (c && c[3] > 0) {
      const a = c[3] * effectiveOpacity(e);
      layers.push([c.slice(0, 3), a]);
      left *= 1 - a;
      if (left < 0.01) break;
    }
  }
  let acc = [255, 255, 255];
  for (const [c, a] of layers.reverse()) acc = acc.map((v, k) => v * (1 - a) + c[k] * a);
  return acc;
};

const allowedOf = (el: Element) => {
  const allowed: string[] = [];
  const reasons: string[] = [];
  for (let e: Element | null = el.closest("[data-rushit-allow]"); e; e = e.parentElement?.closest("[data-rushit-allow]") ?? null) {
    const h = e as HTMLElement;
    allowed.push(...(h.dataset.rushitAllow ?? "").split(" ").filter(Boolean));
    if (h.dataset.rushitReason) reasons.push(h.dataset.rushitReason);
  }
  return { allowed, reasons };
};

const range = (v?: string): [number, number] | null => (v ? (v.split(",").map(Number) as [number, number]) : null);

/** Everything the check needs to judge this frame. Pure facts: no threshold here. */
export const measure = (frame: number, doc: Document = document): ProbeReport => {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const force = doc.createElement("style");
  force.textContent = "*{pointer-events:auto !important}";
  doc.head.appendChild(force);

  const expects: ExpectFact[] = Array.from(doc.querySelectorAll<HTMLElement>("[data-rushit-expect]")).map((wrap) => {
    const kids = Array.from(wrap.children);
    const rect = union(kids.map((k) => k.getBoundingClientRect()).filter((r) => r.width > 0 && r.height > 0));
    const base = {
      id: wrap.dataset.rushitExpect!, scene: sceneOf(wrap),
      visible: range(wrap.dataset.rushitVisible), hidden: range(wrap.dataset.rushitHidden),
    };
    if (!rect) return { ...base, present: false, box: null, inFrame: 0, shown: 0, opacity: 0, clippedBy: null, clippedShare: 0, coveredBy: null, coveredShare: 0, related: [] };
    const samples = sample(wrap, rect, W, H);
    const n = samples.length || 1;
    const clipped = samples.filter((s) => !s.hit);
    const covered = samples.filter((s) => s.hit && s.coveredBy);
    const clipper = clipped.length
      ? (clippingAncestors(wrap).find((c) => {
          const r = c.getBoundingClientRect();
          return clipped.some((s) => s.x < r.left || s.x > r.right || s.y < r.top || s.y > r.bottom);
        }) ?? null)
      : null;
    const coverer = covered[0]?.coveredBy ?? null;
    return {
      ...base, present: true, box: toBox(rect), inFrame: inFrameShare(rect, W, H),
      shown: samples.filter((s) => s.hit && !s.coveredBy).length / n,
      opacity: Math.max(0, ...kids.map(effectiveOpacity)),
      clippedBy: clipper ? selectorOf(clipper) : null, clippedShare: clipped.length / n,
      coveredBy: coverer ? selectorOf(coverer) : null, coveredShare: covered.length / n,
      related: [coverer, clipper].filter(Boolean).map((e) => toBox(e!.getBoundingClientRect())),
    };
  });

  const blocks = Array.from(doc.body.querySelectorAll("*"))
    .map((el) => ({ el, rects: textRects(el) }))
    .filter((t) => t.rects.length && effectiveOpacity(t.el) > 0.05)
    .map((t) => ({ ...t, box: union(t.rects)! }));

  const keyOf = (el: Element) => `${sceneOf(el) ?? ""}|${selectorOf(el)}|${(el.textContent ?? "").trim().slice(0, 60)}`;

  const texts: TextFact[] = blocks.map(({ el, box }) => {
    const h = el as HTMLElement;
    const cs = getComputedStyle(el);
    const br = el.getBoundingClientRect();
    const scale = Math.min(br.width / (h.offsetWidth || br.width), br.height / (h.offsetHeight || br.height));
    const fontPx = parseFloat(cs.fontSize) * scale;
    const clipper = [h, ...clippingAncestors(h)].find((c) => {
      if (getComputedStyle(c).overflow === "visible") return false;
      const r = c.getBoundingClientRect();
      return box.left < r.left - 1 || box.right > r.right + 1 || box.top < r.top - 1 || box.bottom > r.bottom + 1;
    });
    const overflow = cs.overflow !== "visible" && (h.scrollWidth > h.clientWidth + 1 || h.scrollHeight > h.clientHeight + 1);
    const fg = parseColor(cs.color);
    const cx = Math.min(W - 1, Math.max(0, box.left + box.width / 2));
    const cy = Math.min(H - 1, Math.max(0, box.top + box.height / 2));
    const bg = backgroundBehind(el, cx, cy);
    let contrast: number | null = null;
    if (fg && bg) {
      const a = fg[3] * effectiveOpacity(el);
      const c = fg.slice(0, 3).map((v, k) => v * a + bg[k] * (1 - a));
      const [l1, l2] = [luminance(c), luminance(bg)].sort((x, y) => y - x);
      contrast = +((l1 + 0.05) / (l2 + 0.05)).toFixed(2);
    }
    const text = (el.textContent ?? "").trim();
    return {
      key: keyOf(el), scene: sceneOf(el), selector: selectorOf(el), text: text.slice(0, 120),
      words: text.split(/\s+/).filter(Boolean).length, column: h.hasAttribute("data-rushit-column"),
      box: toBox(box), inFrame: inFrameShare(box, W, H), opacity: effectiveOpacity(el),
      fontPx: +fontPx.toFixed(1), bold: Number(cs.fontWeight) >= 700, overflow,
      clippedBy: clipper ? selectorOf(clipper) : null, contrast, ...allowedOf(el),
    };
  });

  const overlaps: OverlapFact[] = [];
  const layered = (el: Element) => allowedOf(el).allowed.includes("chevauchement");
  for (let i = 0; i < blocks.length; i++)
    for (let j = i + 1; j < blocks.length; j++) {
      const a = blocks[i];
      const b = blocks[j];
      if (a.el.contains(b.el) || b.el.contains(a.el) || layered(a.el) || layered(b.el)) continue;
      let area = 0;
      for (const ra of a.rects)
        for (const rb of b.rects)
          area += Math.max(0, Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left)) * Math.max(0, Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top));
      if (area > 4) overlaps.push({ a: keyOf(a.el), b: keyOf(b.el), area: Math.round(area), boxes: [toBox(a.box), toBox(b.box)] });
    }

  force.remove();
  return { frame, width: W, height: H, expects, texts, overlaps };
};
